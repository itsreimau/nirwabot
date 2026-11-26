const Baileys = require("baileys");
const api = require("./api");
const Ctx = require("./ctx");
const format = require("./format");
const { Commands } = require("./handler");
const helper = require("./helper");
const list = require("./list");
const logger = require("../utils/logger");
const EventEmitter = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const util = require("node:util");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

let proxyAgent;
try {
    const proxyUrl = process.env.FETCH_PROXY || process.env.HTTPS_PROXY;
    if (proxyUrl) {
        proxyAgent = new (require("https-proxy-agent").HttpsProxyAgent)(proxyUrl);
        try {
            const undici = require("undici");
            undici.setGlobalDispatcher(new undici.ProxyAgent(proxyUrl));
        } catch {}
    }
} catch {
    proxyAgent = undefined;
}
const SimplDB = require("simpl.db");

class Client {
    constructor(opts = {}) {
        this.authDir = opts.auth?.dir || "./auth";
        this.phoneNumber = opts.auth?.phoneNumber || null;
        this.usePairingCode = opts.auth?.usePairingCode || false;
        this.customPairingCode = opts.auth?.customPairingCode || null;
        this.useStore = opts.auth?.useStore || false;

        this.browser = opts.connection?.browser || Baileys.Browsers.macOS("Safari");
        this.WAVersion = opts.connection?.version || null;
        this.alwaysOnline = opts.connection?.alwaysOnline || false;
        this.selfReply = opts.connection?.selfReply || false;
        this.loggerLevel = opts.connection?.loggerLevel || "silent";

        this.autoRead = opts.messaging?.autoRead || false;
        this.prefix = opts.messaging?.prefix || /^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]/i;
        if (Array.isArray(this.prefix)) this.prefix = this.prefix.sort((a, b) => (a === "" ? 1 : b === "" ? -1 : 0));

        this.databaseDir = opts.database?.dir || "./database";
        this.databaseDefaults = opts.database?.defaults || {};

        this.owner = opts.owner || [];

        this.ev = new EventEmitter();
        this.cmd = new Map();
        this.cooldown = new Baileys.TTLCache({
            stdTTL: 60,
            checkperiod: 10,
            maxKeys: 5000
        });
        this.hearsMap = new Map();
        this.middlewares = [];
        this.logger = pino({
            level: this.loggerLevel
        });
        this.store = null;
        this.storePath = path.resolve(this.authDir, "store.json");
        this.groupCache = new Baileys.TTLCache({
            stdTTL: 24 * 60 * 60,
            maxKeys: 1000
        });
        this.messageIdCache = new Baileys.TTLCache({
            stdTTL: 24 * 60 * 60,
            maxKeys: 5000
        });

        this.db = new SimplDB({
            collectionsFolder: this.databaseDir,
            tabSize: 2
        });
        for (const name of ["bot", "users", "groups"]) {
            if (!this.db.getCollection(name)) this.db.createCollection(name, this.databaseDefaults[name] || {});
        }

        this.reconnectAttempts = 0;
        this.maxReconnectDelay = 30000;
        this.storeSaveInterval = null;
        this.storeCleanupInterval = null;
        this.isShuttingDown = false;
        this.isReconnecting = false;
    }

    _shouldIgnore(message) {
        if (!message?.message || message.message?.protocolMessage || message.messageStubType) return true;
        const remoteJid = message.key?.remoteJid;
        if (!remoteJid || Baileys.isJidStatusBroadcast(remoteJid) || Baileys.isJidNewsletter(remoteJid)) return true;
        const msgTimestamp = Number(message.messageTimestamp);
        if (msgTimestamp && (Math.floor(Date.now() / 1000) - msgTimestamp) > 60) return true;
        if (message.key.fromMe && /^3EB0[0-9A-F]{9,16}$/i.test(message.key.id)) return true;
        if (this.messageIdCache.get(message.key.id)) return true;
        this.messageIdCache.set(message.key.id, true);
        return false;
    }

    async _getSender(key) {
        if (key.fromMe) {
            const user = this.core?.user;
            return {
                jid: Baileys.jidNormalizedUser(user?.lid),
                phoneNumber: Baileys.jidNormalizedUser(user?.id)
            };
        }
        const jids = [key.participant, key.participantAlt, key.remoteJid, key.remoteJidAlt].filter(Boolean).map(Baileys.jidNormalizedUser);
        let jid = jids.find(Baileys.isLidUser);
        let phoneNumber = jids.find(Baileys.isPnUser);
        if (!jid || !phoneNumber) {
            const result = await this.core.findUserId(jid || phoneNumber);
            jid ||= result.lid;
            phoneNumber ||= result.phoneNumber;
        }
        return {
            jid,
            phoneNumber
        };
    }

    _updatePushName(jid, pushName) {
        const senderDb = helper.getDb(this.db.getCollection("users"), jid);
        if (senderDb && senderDb.pushName !== pushName) {
            senderDb.pushName = pushName;
            senderDb.save();
        }
    }

    async _cacheGroupMetadata(id) {
        try {
            const metadata = await this.core?.groupMetadata(id);
            if (metadata) this.groupCache.set(id, metadata);
            return metadata;
        } catch {
            return null;
        }
    }

    async _cacheAllGroups() {
        try {
            const groups = await this.core.groupFetchAllParticipating();
            for (const [id, metadata] of Object.entries(groups)) this.groupCache.set(id, metadata);
        } catch {}
    }

    _onConnectionUpdate = async ({
        connection,
        lastDisconnect,
        qr
    }) => {
        if (qr) {
            logger.info("Scan the QR code below:");
            qrcode.generate(qr, {
                small: true
            });
        }
        if (connection === "close") {
            if (this.isShuttingDown || this.isReconnecting) return;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const reason = lastDisconnect?.error?.message || "Unknown reason";
            logger.warn(`Connection closed (${statusCode || "no-code"}): ${reason}`);
            const fatalReasons = [Baileys.DisconnectReason.loggedOut, Baileys.DisconnectReason.forbidden, Baileys.DisconnectReason.connectionReplaced];
            if (fatalReasons.includes(statusCode)) {
                logger.error("Session terminated or replaced. Stopping reconnect loop.");
                if (statusCode === Baileys.DisconnectReason.loggedOut && fs.existsSync(this.authDir)) {
                    fs.rmSync(this.authDir, {
                        recursive: true,
                        force: true
                    });
                    logger.info("Auth state cleared due to logout.");
                }
                process.exit(1);
            }
            this.isReconnecting = true;
            this.reconnectAttempts += 1;
            const delayMs = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);
            logger.info(`Reconnecting in ${(delayMs / 1000).toFixed(1)}s (Attempt #${this.reconnectAttempts})...`);
            if (this.core?.ev) this.core.ev.removeAllListeners();
            if (this.core?.ws) this.core.ws.removeAllListeners();
            try {
                this.core?.end?.();
            } catch {}
            await Baileys.delay(delayMs);
            try {
                await this.launch();
            } catch (err) {
                logger.error(`Reconnect failed: ${util.format(err)}`);
            } finally {
                this.isReconnecting = false;
            }
        } else if (connection === "open") {
            this.isReconnecting = false;
            this.reconnectAttempts = 0;
            this.readyAt ||= Date.now();
            this.ev.emit("ClientReady", this.core);
            await Baileys.delay(3000);
            await this._cacheAllGroups().catch(error => logger.warn(`Failed caching groups: ${util.format(error)}`));
        }
    };

    _onMessagesUpsert = async (event) => {
        if (event.type !== "notify") return;
        for (const message of event.messages) {
            if (this._shouldIgnore(message)) continue;
            const sender = await this._getSender(message.key);
            if (!sender.jid && !sender.phoneNumber) continue;
            this._updatePushName(sender.jid, message.pushName);
            const body = helper.getBodyFromMsg(message);
            const ctx = new Ctx({
                used: {
                    upsert: body
                },
                args: [],
                self: {
                    ...this,
                    sender: {
                        ...sender,
                        pushName: message.pushName
                    },
                    m: {
                        ...message,
                        body
                    }
                },
                client: this.core
            });
            this.ev.emit("MessagesUpsert", ctx);
            if (this.autoRead) {
                const mode = helper.getDb(this.db.getCollection("bot")).mode;
                const shouldRead = mode === "public" || (mode === "group" && Baileys.isJidGroup(message.key.remoteJid)) || (mode === "private" && (Baileys.isLidUser(message.key.remoteJid) || Baileys.isPnUser(message.key.remoteJid)));
                if (shouldRead) await this.core.readMessages([message.key]);
            }
            await Commands({
                ...this,
                m: {
                    ...message,
                    body
                },
                sender: {
                    ...sender,
                    pushName: message.pushName
                }
            }, this._runMiddlewares.bind(this));
        }
    };

    _onGroupParticipants = async (event) => {
        await this._cacheGroupMetadata(event.id);
        if (!["add", "leave", "remove"].includes(event.action)) return;
        const eventName = event.action === "add" ? "UserJoin" : "UserLeave";
        for (const participant of event.participants)
            this.ev.emit(eventName, {
                id: event.id,
                author: {
                    id: event.author,
                    phoneNumber: event.authorPn,
                    username: event.authorUsername
                },
                participant
            });
    };

    _setupEvent() {
        this.core.ev.on("connection.update", this._onConnectionUpdate);
        this.core.ev.on("creds.update", this.saveCreds);
        this.core.ev.on("messages.upsert", this._onMessagesUpsert);
        this.core.ev.on("group-participants.update", this._onGroupParticipants);
        this.core.ev.on("groups.update", async ([event]) => this._cacheGroupMetadata(event.id));
        this.core.ev.on("groups.upsert", async ([event]) => this._cacheGroupMetadata(event.id));

        for (const type of ["passkey_prologue_request", "crsc_continuation"])
            this.core.ws.on(`CB:notification,type:${type}`, async (node) => {
                await this.core.sendNode({
                    tag: "ack",
                    attrs: {
                        id: node.attrs.id,
                        class: "notification",
                        to: node.attrs.from,
                        type: node.attrs.type
                    }
                });
            });
    }

    use(fn) {
        this.middlewares.push(fn);
    }

    async _runMiddlewares(ctx, index = 0) {
        if (index >= this.middlewares.length) return true;
        let shouldContinue = false;
        let nextCalled = false;
        await this.middlewares[index](ctx, async () => {
            if (nextCalled) throw new Error("next() called multiple times in middleware");
            nextCalled = true;
            shouldContinue = await this._runMiddlewares(ctx, index + 1);
        });
        return nextCalled && shouldContinue;
    }

    command(opts, code) {
        this.cmd.set((typeof opts === "string" ? {
            name: opts,
            code
        } : opts).name, typeof opts === "string" ? {
            name: opts,
            code
        } : opts);
    }

    hears(query, callback) {
        this.hearsMap.set(query, {
            name: query,
            code: callback
        });
    }

    get api() {
        return api;
    }
    get format() {
        return format;
    }
    get helper() {
        return helper;
    }
    get list() {
        return list;
    }

    checkOwner(jid = Baileys.PSA_WID, fromMe = false) {
        return helper.checkOwner(jid, this.owner, fromMe);
    }
    getPushName(jid = Baileys.PSA_WID) {
        return helper.getPushName(jid, this.db);
    }
    getId(jid = Baileys.PSA_WID) {
        return helper.getId(jid);
    }
    getDb(collection, jid = Baileys.PSA_WID) {
        return helper.getDb(this.db.getCollection(collection), jid);
    }

    async forceCommand(jid, command, text = "", sender) {
        const activePrefix = helper.getDb(this.db.getCollection("bot"))?.lastPrefix || "/";
        const body = text ? `${activePrefix}${command} ${text}` : `${activePrefix}${command}`;
        const fakeMsg = {
            key: {
                remoteJid: jid,
                fromMe: Baileys.areJidsSameUser(sender.jid, this.core?.user?.lid),
                id: Baileys.generateMessageIDV2(),
                ...(jid !== sender.jid && {
                    participant: sender.jid,
                    ...(sender.phoneNumber && {
                        participantAlt: sender.phoneNumber
                    })
                })
            },
            message: {
                conversation: body
            },
            body,
            pushName: sender.pushName
        };
        await Commands({
            ...this,
            m: fakeMsg,
            sender
        }, this._runMiddlewares.bind(this));
    }

    async launch() {
        const {
            state,
            saveCreds
        } = await Baileys.useMultiFileAuthState(this.authDir);
        this.state = state;
        this.saveCreds = saveCreds;

        this.core = Baileys.default({
            auth: this.state,
            logger: this.logger,
            ...(this.WAVersion && {
                version: this.WAVersion
            }),
            browser: this.browser,
            markOnlineOnConnect: this.alwaysOnline,
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            ...(this.useStore && {
                getMessage: async (key) => {
                    const msg = await this.store?.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
            }),
            emitOwnEvents: this.selfReply,
            cachedGroupMetadata: async (jid) => this.groupCache.get(jid),
            generateHighQualityLinkPreview: true,
            ...(proxyAgent && {
                agent: proxyAgent
            })
        });

        if (this.usePairingCode && !this.core.authState.creds.registered) {
            if (!this.phoneNumber) throw new Error("phoneNumber required for pairing code");
            this.phoneNumber = this.phoneNumber.replace(/[^0-9]/g, "");
            if (!this.phoneNumber.length) throw new Error("Invalid phoneNumber");
            await Baileys.delay(3000);
            const code = await this.core.requestPairingCode(this.phoneNumber, this.customPairingCode);
            logger.info(`Pairing Code: ${code}`);
        }

        if (!fs.existsSync(this.databaseDir))
            fs.mkdirSync(this.databaseDir, {
                recursive: true
            });

        this._setupStore();
        this._setupEvent();

        this.sendMessage = this._createSendMessage.bind(this);
        return this;
    }

    _setupStore() {
        if (!this.useStore) return;
        if (this.storeSaveInterval) clearInterval(this.storeSaveInterval);
        if (this.storeCleanupInterval) clearInterval(this.storeCleanupInterval);
        if (!this.store) {
            this.store = Baileys.makeInMemoryStore({
                logger: this.logger
            });
            if (fs.existsSync(this.storePath)) {
                try {
                    this.store.readFromFile(this.storePath);
                } catch (error) {
                    logger.warn(`Failed reading store file: ${util.format(error)}`);
                }
            }
        }
        this.store.bind(this.core.ev);
        this.storeSaveInterval = setInterval(() => {
            try {
                this.store.writeToFile(this.storePath);
            } catch (error) {
                logger.error(`Store write error: ${util.format(error)}`);
            }
        }, 10000);
        this.store.cleanupMessages = (cutoff) => {
            for (const jid of Object.keys(this.store.messages)) this.store.messages[jid] = this.store.messages[jid].filter(msg => msg.messageTimestamp * 1000 > cutoff);
        };
        this.storeCleanupInterval = setInterval(() => this.store.cleanupMessages(Date.now() - (7 * 24 * 60 * 60 * 1000)), 24 * 60 * 60 * 1000);
    }


}

const ClientMixin = require("./client-media");
for (const name of Object.getOwnPropertyNames(ClientMixin.prototype)) {
    if (name !== "constructor") Object.defineProperty(Client.prototype, name, Object.getOwnPropertyDescriptor(ClientMixin.prototype, name));
}

module.exports = Client;
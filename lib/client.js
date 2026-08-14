const Baileys = require("baileys");
const EventEmitter = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const util = require("node:util");
const { NodeCache } = require("@cacheable/node-cache");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const SimplDB = require("simpl.db");
const vCard = require("vcard-parser");
const WASF = require("wa-sticker-formatter");
const api = require("./api");
const Ctx = require("./ctx");
const format = require("./format");
const { Commands } = require("./handler");
const helper = require("./helper");
const list = require("./list");

class Client {
    constructor(opts = {}) {
        this.authOpts = opts.auth || {};
        this.authDir = this.authOpts.dir || "./auth";
        this.phoneNumber = this.authOpts.phoneNumber || null;
        this.usePairingCode = this.authOpts.usePairingCode || false;
        this.customPairingCode = this.authOpts.customPairingCode || null;
        this.useStore = this.authOpts.useStore || false;

        this.connOpts = opts.connection || {};
        this.browser = this.connOpts.browser || Baileys.Browsers.macOS("Safari");
        this.WAVersion = this.connOpts.version || null;
        this.alwaysOnline = this.connOpts.alwaysOnline || false;
        this.selfReply = this.connOpts.selfReply || false;
        this.loggerLevel = this.connOpts.loggerLevel || "silent";

        this.msgOpts = opts.messaging || {};
        this.autoRead = this.msgOpts.autoRead || false;
        this.prefix = this.msgOpts.prefix || /^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]/i;

        this.dbOpts = opts.database || {};
        this.databaseDir = this.dbOpts.dir || "./database";
        this.databaseDefaults = this.dbOpts.defaults || {};

        this.owner = opts.owner || [];
        this.ev = new EventEmitter();
        this.cmd = new Map();
        this.cooldown = new Map();
        this.hearsMap = new Map();
        this.middlewares = [];
        this.logger = pino({
            level: this.loggerLevel
        });
        this.store = null;
        this.storePath = path.resolve(this.authDir, "store.json");
        this.groupCache = new NodeCache({
            stdTTL: 24 * 60 * 60,
            useClones: false
        });
        this.messageIdCache = new NodeCache({
            stdTTL: 24 * 60 * 60,
            useClones: false
        });
        this.db = new SimplDB({
            collectionsFolder: this.databaseDir,
            tabSize: 2
        });

        if (Array.isArray(this.prefix)) {
            if (this.prefix.includes("")) this.prefix.sort((a, b) => a === "" ? 1 : b === "" ? -1 : 0);
        } else if (typeof this.prefix === "string") {
            this.prefix = this.prefix.split("");
        }

        const collections = ["bot", "users", "groups"];
        for (const name of collections) {
            if (!this.db.getCollection(name)) this.db.createCollection(name, this.databaseDefaults?.[name] || {});
        }
    }

    _shouldIgnore(message) {
        if (message.message?.protocolMessage) return true;
        if (message.key.fromMe && message.key.id.includes("STARFALL")) return true;
        if (this.messageIdCache.get(message.key.id)) return true;
        this.messageIdCache.set(message.key.id, true);
        return false;
    }

    _getSender(key) {
        const senderJids = [key.participant, key.participantAlt, key.remoteJid, key.remoteJidAlt].filter(Boolean).map(jid => Baileys.jidNormalizedUser(jid));
        return {
            jid: key.fromMe ? Baileys.jidNormalizedUser(this.core?.user?.id) : senderJids.find(jid => Baileys.isPnUser(jid)),
            lid: key.fromMe ? Baileys.jidNormalizedUser(this.core?.user?.lid) : senderJids.find(jid => Baileys.isLidUser(jid))
        };
    }

    _updatePushName(jid, pushName) {
        const userDb = helper.getDb(this.db.getCollection("users"), jid);
        if (userDb?.pushName !== pushName) {
            userDb.pushName = pushName;
            userDb.save();
        }
    }

    async _cacheGroupMetadata(id) {
        try {
            const metadata = await this.core?.groupMetadata(id);
            this.groupCache.set(id, metadata);
            return metadata;
        } catch {
            return null;
        }
    }

    async _cacheAllGroups() {
        const groups = await this.core.groupFetchAllParticipating();
        for (const [id, metadata] of Object.entries(groups)) this.groupCache.set(id, metadata);
    }

    _setupEvent() {
        this.core.ev.on("connection.update", async (update) => {
            const {
                connection,
                lastDisconnect,
                qr
            } = update;

            if (connection === "open" && qr && !this.usePairingCode) {
                console.log(util.styleText("cyan", "[i]"), "Scan the QR code below to connect:");
                qrcode.generate(qr, {
                    small: true
                });
            } else if (connection === "close") {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== Baileys.DisconnectReason.loggedOut;
                console.warn(util.styleText("yellow", "[!]"), `Connection closed: ${lastDisconnect.error}, reconnecting: ${shouldReconnect}`);
                if (shouldReconnect) await this.launch();
            } else if (connection === "open") {
                if (!this.readyAt) this.readyAt = Date.now();
                this.ev.emit("ClientReady", this.core);
                await Baileys.delay(3000);
                await this._cacheAllGroups();
            }
        });

        this.core.ev.on("creds.update", this.saveCreds);

        this.core.ev.on("messages.upsert", async (event) => {
            if (event.type !== "notify") return;

            for (const message of event.messages) {
                if (this._shouldIgnore(message)) continue;

                const sender = this._getSender(message.key);
                if (!sender.jid || !sender.lid) continue;

                this._updatePushName(sender.lid, message.pushName);
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
                    Client: this.core
                });

                this.ev.emit("MessagesUpsert", ctx);
                if (this.autoRead) await this.core.readMessages([message.key]);
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
        });

        this.core.ev.on("group-participants.update", async (event) => {
            await this._cacheGroupMetadata(event.id);
            const {
                action,
                participants,
                ...rest
            } = event;
            if (!["add", "leave", "remove"].includes(action)) return;

            const eventName = action === "add" ? "UserJoin" : "UserLeave";
            for (const participant of participants) {
                this.ev.emit(eventName, {
                    ...rest,
                    participant: participant.id,
                    participantPn: participant.phoneNumber
                });
            }
        });

        this.core.ev.on("groups.update", async ([event]) => await this._cacheGroupMetadata(event.id));
        this.core.ev.on("groups.upsert", async ([event]) => await this._cacheGroupMetadata(event.id));
        this.core.ev.on("call", (calls) => calls.forEach(call => this.ev.emit("Call", call)));

        this._setupNotificationAck("passkey_prologue_request");
        this._setupNotificationAck("crsc_continuation");
    }

    _setupNotificationAck(type) {
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
        const command = typeof opts === "string" ? {
            name: opts,
            code
        } : opts;
        this.cmd.set(command.name, command);
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
        const coll = this.db.getCollection(collection);
        return helper.getDb(coll, jid);
    }

    async forceCommand(jid, command, text = "", sender) {
        const body = text ? `${command} ${text}` : command;
        const fakeMsg = {
            key: {
                remoteJid: jid,
                fromMe: Baileys.areJidsSameUser(sender.jid, this.core?.user?.id),
                id: Baileys.generateMessageIDV2(),
                ...(jid !== sender.jid && {
                    participant: sender.jid,
                    ...(sender.lid && {
                        participantAlt: sender.lid
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
            sender,
            force: true
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
            ...(this.WAVersion && {
                version: this.WAVersion
            }),
            browser: this.browser,
            logger: this.logger,
            emitOwnEvents: this.selfReply,
            auth: this.state,
            markOnlineOnConnect: this.alwaysOnline,
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
            ...(this.useStore && {
                getMessage: async (key) => (await this.store.loadMessage(key.remoteJid, key.id))?.message
            }),
            cachedGroupMetadata: async (jid) => this.groupCache.get(jid)
        });

        if (this.usePairingCode && !this.core.authState.creds.registered) {
            if (!this.phoneNumber) throw new Error("phoneNumber is required when using pairing code");
            this.phoneNumber = this.phoneNumber.replace(/[^0-9]/g, "");
            if (!this.phoneNumber.length) throw new Error("Invalid phoneNumber");
            await Baileys.delay(3000);
            const code = await this.core.requestPairingCode(this.phoneNumber, this.customPairingCode);
            console.log(util.styleText("cyan", "[i]"), `Pairing Code: ${code}`);
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
        this.store = Baileys.makeInMemoryStore({
            logger: this.logger,
            socket: this.core
        });
        this.store.bind(this.core.ev);
        if (fs.existsSync(this.storePath)) this.store.readFromFile(this.storePath);
        setInterval(() => this.store.writeToFile(this.storePath), 10000);

        this.store.cleanupMessages = (cutoff) => {
            for (const jid of Object.keys(this.store.messages)) this.store.messages[jid] = this.store.messages[jid].filter(msg => msg.messageTimestamp * 1000 > cutoff);
        };
        setInterval(() => this.store.cleanupMessages(Date.now() - (7 * 24 * 60 * 60 * 1000)), 24 * 60 * 60 * 1000);
    }

    async _createSendMessage(jid, content, options = {}) {
        if (typeof content === "string")
            content = {
                text: content
            };
        if (content?.album) {
            const {
                album,
                ...rest
            } = content;
            if (album.length === 1) {
                content = {
                    ...album[0],
                    ...rest
                };
            } else {
                if (album.every(a => !a.caption) && rest.caption) album[0].caption = rest.caption;
                content = {
                    album
                };
            }
        }

        if (content?.sticker) {
            const sticker = Buffer.isBuffer(content.sticker) ? content.sticker : content.sticker?.url;
            if (sticker) {
                const {
                    pack = config.sticker.packname, author = config.sticker.author, type = WASF.StickerTypes.FULL, categories = ["🌕"], id = Date.now().toString(), quality = 50, background, ...rest
                } = options;
                content = {
                    sticker: await new WASF.Sticker(sticker, {
                        pack,
                        author,
                        type,
                        categories,
                        id,
                        quality,
                        background
                    }).build()
                };
                options = rest;
            }
        }
        if (content?.contacts) {
            const contacts = Array.isArray(content.contacts) ? content.contacts : content.contacts?.contacts || [content.contacts];
            const parsed = (Array.isArray(contacts) ? contacts : [contacts]).map(contact => {
                if (contact.vcard)
                    return {
                        displayName: contact.displayName || "nirwabot",
                        vcard: contact.vcard
                    };
                if (contact.number) {
                    const clean = contact.number.toString().replace(/\s/g, "");
                    const vcard = vCard.generate({
                        version: [{
                            value: "3.0"
                        }],
                        fn: [{
                            value: contact.displayName || "nirwabot"
                        }],
                        org: [{
                            value: [contact.org || ""]
                        }],
                        tel: [{
                            value: `+${clean}`,
                            meta: {
                                type: ["CELL", "VOICE"],
                                waid: [clean]
                            }
                        }]
                    });
                    return {
                        displayName: contact.displayName || "nirwabot",
                        vcard
                    };
                }
                return null;
            }).filter(Boolean);
            if (parsed.length)
                content = {
                    contacts: Array.isArray(content.contacts) && !content.contacts?.contacts ? {
                        displayName: "nirwabot",
                        contacts: parsed
                    } : {
                        displayName: content.contacts?.displayName || "nirwabot",
                        contacts: parsed
                    }
                };
        }
        if (content?.stickerPack) {
            const {
                stickers,
                name = "Sticker Pack",
                publisher = config.bot.name,
                description = "",
                cover,
                ...rest
            } = content.stickerPack;
            delete content.stickerPack;
            const defaultOpts = {
                pack: options.pack || config.sticker.packname,
                author: options.author || config.sticker.author,
                quality: options.quality || 50,
                type: options.type || WASF.StickerTypes.FULL,
                categories: options.categories || ["🌕"]
            };
            const processed = await Promise.all(stickers.map(async (sticker, index) => {
                const buffer = await new WASF.Sticker(sticker.data, {
                    ...defaultOpts,
                    ...sticker,
                    id: sticker.id || `${Date.now()}-${index}`
                }).build();
                return {
                    data: buffer,
                    emojis: sticker.emojis || ["🌕"],
                    isCover: index === 0 && !cover
                };
            }));
            content = {
                name,
                publisher,
                description,
                cover: processed[0].data,
                stickers: processed.map(sticker => ({
                    data: sticker.data,
                    emojis: sticker.emojis
                }))
            };
            options = {
                ...options,
                ...rest
            };
            delete options.pack;
            delete options.author;
        }
        if (Baileys.isPnUser(jid) || Baileys.isLidUser(jid)) content.ai = true;
        return await this.core.sendMessage(jid, content, options);
    }
}

module.exports = Client;

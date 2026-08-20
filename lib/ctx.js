const Baileys = require("@itsliaaa/baileys");
const util = require("node:util");
const { uguu } = require("@neoxr/helper");
const axios = require("axios");
const { default: axiosRetry } = require("axios-retry");
const api = require("./api");
const { MessageCollector } = require("./collector");
const format = require("./format");
const { Group, GroupData } = require("./group");
const helper = require("./helper");
const list = require("./list");

axiosRetry(axios, {
    retries: 3,
    retryCondition: (error) => {
        const status = error.response?.status;
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || status === 408 || status === 429;
    },
    retryDelay: (retryCount) => Math.pow(2, retryCount - 1) * 1000 + Math.random() * 500
});

class Ctx {
    constructor(opts) {
        this._self = opts.self;
        this._client = opts.client;
        this._msg = this._self.m;
        this._sender = this._self.sender;
        this._used = opts.used;
        this._args = opts.args;
        this._text = opts.text;
        this._db = this._self.db;
    }

    get bot() {
        return this._self;
    }
    get core() {
        return this._client;
    }
    get id() {
        return this._msg.key.remoteJid;
    }
    get store() {
        return this._self.store;
    }
    get body() {
        return this._msg.body;
    }
    get used() {
        return this._used;
    }
    get args() {
        return this._args;
    }
    get text() {
        return this._text;
    }

    get sender() {
        return {
            ...this._sender,
            isOwner: () => helper.checkOwner(this._sender.jid, this._self.owner, this._msg.key.fromMe)
        };
    }

    get me() {
        const user = this._client?.user;
        return user ? {
            ...user,
            readyAt: this._self.readyAt
        } : null;
    }

    get db() {
        const bot = this._db.getCollection("bot");
        const users = this._db.getCollection("users");
        const groups = this._db.getCollection("groups");
        return {
            core: this._db,
            users,
            groups,
            bot: helper.getDb(bot),
            user: helper.getDb(users, this._sender.lid),
            group: this.isGroup() ? helper.getDb(groups, this.id) : null
        };
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

    get request() {
        return axios;
    }

    get quoted() {
        const context = this._msg.message?.[this.getMessageType()]?.contextInfo || {};
        if (!context?.quotedMessage) return null;

        const message = Baileys.extractMessageContent(context.quotedMessage) || {};
        const chat = context.remoteJid || this.id;
        const sender = context.participant || chat;

        return {
            body: helper.getBodyFromMsg({
                message
            }),
            message,
            messageType: helper.getMessageType(message),
            key: {
                remoteJid: chat,
                id: context.stanzaId,
                fromMe: Baileys.areJidsSameUser(sender, this.me?.id),
                participant: Baileys.isJidGroup(chat) ? sender : null
            },
            id: chat,
            sender,
            pushName: helper.getPushName(sender, this._db),
            media: {
                download: () =>
                    this._downloadMediaMessage({
                        message
                    }),
                upload: () =>
                    this._uploadMediaMessage({
                        message
                    })
            }
        };
    }

    get msg() {
        const message = Baileys.extractMessageContent(this._msg.message);
        return {
            ...this._msg,
            message,
            messageType: helper.getMessageType(message),
            media: {
                download: () =>
                    this._downloadMediaMessage({
                        message
                    }),
                upload: () =>
                    this._uploadMediaMessage({
                        message
                    })
            }
        };
    }

    get groups() {
        return new Group(this);
    }

    isGroup() {
        return Baileys.isJidGroup(this.id);
    }
    isPrivate() {
        return Baileys.isPnUser(this.id) || Baileys.isLidUser(this.id);
    }

    group(jid = this.id, useCache = true) {
        return Baileys.isJidGroup(jid) ? new GroupData(this, jid, useCache) : null;
    }

    flag(rules = {}) {
        const parsed = util.parseArgs({
            args: this._text.split(" "),
            options: rules,
            allowPositionals: true
        });
        return {
            input: parsed.positionals.join(" "),
            ...parsed.values
        };
    }

    async target(priority = ["quoted", "mentioned", "text"]) {
        const strategies = {
            mentioned: async () => {
                const mentioned = await this.getMentioned();
                return mentioned.length && {
                    jid: mentioned[0],
                    source: "mentioned"
                };
            },
            text: () => {
                const number = this.args[0]?.replace(/[^\d]/g, "");
                return number && {
                    jid: number + Baileys.S_WHATSAPP_NET,
                    source: "text"
                };
            },
            text_group: () => {
                const number = this.args[0]?.replace(/[^\d]/g, "");
                return number && {
                    jid: `${number}@g.us`,
                    source: "text_group"
                };
            },
            quoted: () =>
                this.quoted?.sender && {
                    jid: this.quoted.sender,
                    source: "quoted"
                }
        };

        for (const type of priority) {
            const strategy = strategies[type];
            if (!strategy) continue;
            const result = await strategy();
            if (result) {
                if (Baileys.isPnUser(result.jid)) result.jid = (await this.core.findUserId(result.jid)).lid;
                return result;
            }
        }
        return {
            jid: null,
            source: null
        };
    }

    isMedia(types, sources = ["primary", "quoted"]) {
        const map = {
            audio: "audioMessage",
            document: ["documentMessage", "documentWithCaptionMessage"],
            image: "imageMessage",
            sticker: "stickerMessage",
            text: ["conversation", "extendedTextMessage"],
            video: "videoMessage"
        };

        for (const source of sources) {
            const type = source === "primary" ? this.getMessageType() : this.quoted?.messageType;
            if (!type) continue;
            for (const media of types) {
                const mapped = map[media];
                if (!mapped) continue;
                if (Array.isArray(mapped) ? mapped.includes(type) : type === mapped) return media;
            }
        }
        return false;
    }

    isCmd() {
        const result = helper.parseCommand(this._self.prefix, this._msg.body);
        if (!result.commandName) return null;

        const commandsList = Array.from(this._self.cmd?.values() || []);
        const matched = commandsList.filter(cmd => cmd.name?.toLowerCase() === result.commandName || (Array.isArray(cmd.aliases) && cmd.aliases.includes(result.commandName)) || cmd.aliases === result.commandName);

        if (matched.length)
            return {
                msg: result.text,
                prefix: result.selectedPrefix,
                name: result.commandName,
                input: result.text
            };

        const candidates = commandsList.flatMap(cmd => [cmd.name, ...(cmd.aliases || [])]);
        const suggestion = helper.didYouMean(result.commandName, candidates);
        return suggestion ? {
            msg: result.text,
            prefix: result.selectedPrefix,
            didyoumean: suggestion,
            input: result.text
        } : null;
    }

    async _downloadMediaMessage(message) {
        try {
            return await Baileys.downloadMediaMessage(message, "buffer", {}, {
                logger: this._self.logger,
                reuploadRequest: this._client.updateMediaMessage
            });
        } catch {
            return null;
        }
    }

    async _uploadMediaMessage(message) {
        try {
            const buffer = await this._downloadMediaMessage(message?.header || message);
            return Buffer.isBuffer(buffer) ? (await uguu(buffer)).data.url : null;
        } catch {
            return null;
        }
    }

    async read() {
        await this._client.readMessages([this._msg.key]);
    }
    async block(jid = this._sender.jid) {
        return this._client.updateBlockStatus(jid, "block");
    }
    async unblock(jid = this._sender.jid) {
        return this._client.updateBlockStatus(jid, "unblock");
    }
    async bio(content) {
        await this._client.updateProfileStatus(content);
    }
    async fetchBio(jid = this._sender.jid) {
        return await this._client.fetchStatus(jid);
    }
    async simulateTyping() {
        await this._client.sendPresenceUpdate("composing", this.id);
    }
    async simulateRecording() {
        await this._client.sendPresenceUpdate("recording", this.id);
    }

    async sendMessage(jid, content, options = {}) {
        return await this._self.sendMessage(jid, content, options);
    }

    async reply(content, options = {}) {
        return await this._self.sendMessage(this.id, content, {
            ...options,
            quoted: this._msg
        });
    }

    async replyWithJid(jid, content, options = {}) {
        return await this._self.sendMessage(jid, content, {
            ...options,
            quoted: this._msg
        });
    }

    async react(jid, emoji, key) {
        return await this._self.sendMessage(jid, {
            react: {
                text: emoji,
                key: key || this._msg.key
            }
        });
    }

    async replyReact(emoji, key) {
        return await this.react(this.id, emoji, key);
    }

    async deleteMessage(jid, key) {
        return await this._self.sendMessage(jid, {
            delete: key
        });
    }

    async editMessage(jid, key, newText) {
        return await this._self.sendMessage(jid, {
            text: newText,
            edit: key
        });
    }

    getMessageType() {
        return this.msg.messageType;
    }
    async getMentioned() {
        return this._msg.message?.[this.getMessageType()]?.contextInfo?.mentionedJid || [];
    }
    getDevice(id = this._msg.key.id) {
        return Baileys.getDevice(id);
    }
    checkOwner(jid = this._sender.lid, fromMe = false) {
        return helper.checkOwner(jid, this._self.owner, fromMe);
    }
    getPushName(jid = this._sender.lid) {
        return helper.getPushName(jid, this._db);
    }
    getId(jid = this._sender.jid) {
        return helper.getId(jid);
    }
    getDb(collection, jid = this._sender.lid) {
        const coll = this._db.getCollection(collection);
        return helper.getDb(coll, jid);
    }

    MessageCollector(args) {
        return new MessageCollector({
            self: this._self,
            msg: this._msg
        }, args);
    }
}

module.exports = Ctx;
const Baileys = require("baileys");
const { MessageCollector } = require("./collector");
const helper = require("./helper");

class CtxActions {
    async read() {
        await this._client.readMessages([this._msg.key]);
    }
    async block(jid = this._sender.jid) {
        return this._client.updateBlockStatus(jid, "block");
    }
    async unblock(jid = this._sender.jid) {
        return this._client.updateBlockStatus(jid, "unblock");
    }
    async bio(text, options) {
        await this._client.updateTextStatus(text, options);
    }
    async fetchBio(jid = this._sender.jid) {
        return (await this._client.fetchTextStatus(jid))?.[0] || null;
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
    async delete(key) {
        return await this.deleteMessage(this.id, key);
    }
    async editMessage(jid, newText, key) {
        return await this._self.sendMessage(jid, {
            text: newText,
            edit: key
        });
    }
    async edit(newText, key) {
        return await this.editMessage(this.id, newText, key);
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
    checkOwner(jid = this._sender.jid, fromMe = false) {
        return helper.checkOwner(jid, this._self.owner, fromMe);
    }
    getPushName(jid = this._sender.jid) {
        return helper.getPushName(jid, this._db);
    }
    getId(jid = this._sender.jid) {
        return helper.getId(jid);
    }
    getDb(collection, jid = this._sender.jid) {
        return helper.getDb(this._db.getCollection(collection), jid);
    }

    MessageCollector(args) {
        return new MessageCollector({
            self: this._self,
            msg: this._msg
        }, args);
    }
}

module.exports = CtxActions;
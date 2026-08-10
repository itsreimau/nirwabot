const EventEmitter = require("node:events");

class Cooldown extends EventEmitter {
    constructor(ctx, ms, mode = "multi") {
        super();
        this.ms = ms;
        this.cooldown = ctx._self.cooldown;
        this.timeout = 0;

        const query = mode === "single" ? `cooldown_${ctx._used.command}_${ctx._msg.key.remoteJid}_${ctx._sender.jid}` : `cooldown_${ctx._msg.key.remoteJid}_${ctx._sender.jid}`;
        const get = this.cooldown.get(query);

        if (get) {
            this.timeout = Number(get) - Date.now();
        } else {
            this.cooldown.set(query, Date.now() + ms);
            setTimeout(() => {
                this.cooldown.delete(query);
                this.emit("end");
            }, ms);
        }
    }

    get onCooldown() {
        return Boolean(this.timeout);
    }
    get timeleft() {
        return this.timeout;
    }
}

module.exports = Cooldown;
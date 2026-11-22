const EventEmitter = require("node:events");

class Cooldown extends EventEmitter {
    constructor(ctx, ms) {
        super();
        this.ms = ms;
        this.cooldown = ctx._self.cooldown;
        this.timeout = 0;

        const query = `cooldown_${ctx._used.command}_${ctx._msg.key.remoteJid}_${ctx._sender.jid}`;
        const get = this.cooldown.get(query);

        if (get && Number(get) > Date.now()) this.timeout = Number(get) - Date.now();
        else this.cooldown.set(query, Date.now() + ms, Math.ceil(ms / 1000) + 1);
    }

    get onCooldown() {
        return this.timeout > 0;
    }
    get timeleft() {
        return this.timeout;
    }
}

module.exports = Cooldown;
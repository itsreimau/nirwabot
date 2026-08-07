const EventEmitter = require("node:events");
const helper = require("./helper");

class Collector extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.isRun = false;
        this.filter = opts.filter || (() => true);
        if (this.isRun) throw new Error("Some collector already run in another instance.");
        if (typeof this.filter !== "function") throw new Error("Filter options in collector must be function.");

        this.time = opts.time || 0;
        this.max = opts.max || 0;
        this.maxProcessed = opts.maxProcessed || 0;
        this.collector = new Map();
        this.collect = this.collect.bind(this);
        this.stop = this.stop.bind(this);
        this.received = 0;

        if (this.time && this.time > 0) this.isRun = setTimeout(() => this.stop("timeout"), this.time);
    }

    async collect(ctx) {
        if (!this.isRun) return;
        const collCtx = this._collect(ctx);
        if (!collCtx) return;

        this.received++;
        if (this.maxProcessed && this.received > this.maxProcessed) return this.stop("processedLimit");

        const filtered = await this.filter(collCtx, this.collector);
        if (!filtered) return;

        if (this.max && this.collector.size >= this.max) return this.stop("limit");

        this.collector.set(collCtx._msg?.key?.id, collCtx);
        this.emit("collect", collCtx);
    }

    stop(reason = "") {
        if (this.isRun) {
            clearTimeout(this.isRun);
            this.isRun = null;
            this.emit("end", reason);
        }
    }
}

class MessageCollector extends Collector {
    constructor(clientReq, opts = {}) {
        super(opts);
        this.jids = [clientReq.msg.key.remoteJid, ...(opts.hears || [])];

        this.handleCollect = (ctx) => this.collect(ctx);
        clientReq.self.ev.on("MessagesUpsert", this.handleCollect);
        this.once("end", () => clientReq.self.ev.removeListener("MessagesUpsert", this.handleCollect));
    }

    _collect(ctx) {
        const chats = [ctx.msg.key.remoteJid, ctx.msg.key.remoteJidAlt];
        for (const jid of this.jids) {
            for (const chat of chats) {
                if (helper.areJidsSameUser(jid, chat)) return ctx;
            }
        }
        return false;
    }
}

module.exports = {
    Collector,
    MessageCollector
};
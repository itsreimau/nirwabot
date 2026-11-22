const config = require("../../runtime/config");
const { exec } = require("node:child_process");
const path = require("node:path");

module.exports = {
    name: "restart",
    aliases: ["r"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        if (!process.env.PM2_HOME) return await ctx.reply(ctx.format.info("Tidak di PM2, restart manual."));
        const waitMsg = await ctx.reply(ctx.format.info(config.msg.wait));
        const botDb = ctx.db.bot;
        botDb.restart = {
            id: ctx.id,
            key: waitMsg.key,
            timestamp: Date.now(),
            readyAt: ctx.me.readyAt
        };
        botDb.save();
        const procName = process.env.name || path.basename(process.cwd());
        exec(`pm2 restart "${procName.replace(/"/g, "")}"`);
    }
};
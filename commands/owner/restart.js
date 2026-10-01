const { exec } = require("node:child_process");

module.exports = {
    name: "restart",
    aliases: ["r"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        if (!process.env.PM2_HOME) return await ctx.reply(ctx.format.info("Tidak di PM2, restart manual."));
        try {
            const waitMsg = await ctx.reply(ctx.format.info(config.msg.wait));
            const botDb = ctx.db.bot;
            botDb.restart = {
                id: ctx.id,
                key: waitMsg.key,
                timestamp: Date.now(),
                readyAt: ctx.me.readyAt
            };
            botDb.save();
            exec("pm2 restart $(basename $(pwd))");
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
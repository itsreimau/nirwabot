const util = require("node:util");

module.exports = {
    name: "collector",
    aliases: ["coll", "collect"],
    category: "misc",
    code: async (ctx) => {
        const timeout = parseInt(ctx.args[0], 10) || 60000;
        if (isNaN(timeout)) return await ctx.reply(ctx.format.info("Waktu timeout harus berupa angka!"));
        try {
            const collector = ctx.MessageCollector({
                time: timeout,
                filter: (collCtx) => !collCtx.msg.key.fromMe
            });
            await ctx.reply(ctx.format.info(`Collector dimulai dengan timeout ${ctx.format.convertMsToDuration(timeout)}.`));
            collector.on("collect", async (collCtx) =>
                await collCtx.reply(ctx.format.monospace(util.inspect(collCtx.bot.m, {
                    depth: null,
                    maxArrayLength: null,
                    maxStringLength: null
                }))));
            collector.on("end", async () => await ctx.reply(ctx.format.info("Collector berhenti!")));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
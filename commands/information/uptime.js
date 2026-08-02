module.exports = {
    name: "uptime",
    aliases: ["runtime"],
    category: "information",
    code: async (ctx) => {
        await ctx.reply(ctx.format.info(`Bot telah aktif selama ${ctx.format.convertMsToDuration(Date.now() - ctx.me.readyAt)}.`));
    }
};
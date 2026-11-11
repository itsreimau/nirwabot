module.exports = {
    name: "uptime",
    aliases: ["runtime"],
    category: "information",
    code: async (ctx) => {
        await ctx.reply(ctx.format.info(`Aktif ${ctx.format.convertMsToDuration(Date.now() - ctx.me.readyAt)}.`));
    }
};
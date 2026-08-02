module.exports = {
    name: "botgroup",
    aliases: ["botgc", "gcbot"],
    category: "information",
    code: async (ctx) => {
        await ctx.reply(config.bot.groupLink);
    }
};
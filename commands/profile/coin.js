module.exports = {
    name: "coin",
    aliases: ["koin"],
    category: "profile",
    code: async (ctx) => {
        if (ctx.sender.isOwner() || ctx.db.user?.premium) return await ctx.reply(ctx.format.info("Anda memiliki koin tak terbatas."));
        await ctx.reply(ctx.format.info(`Anda memiliki ${ctx.db.user.coin || 0} koin tersisa.`));
    }
};
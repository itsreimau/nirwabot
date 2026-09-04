module.exports = {
    name: "coin",
    aliases: ["koin"],
    category: "profile",
    code: async (ctx) => {
        const userDb = ctx.db.user;
        if (ctx.sender.isOwner() || userDb.premium) return await ctx.reply(ctx.format.info("Anda memiliki koin tak terbatas."));
        await ctx.reply(ctx.format.info(`Anda memiliki ${userDb.coin} koin tersisa.`));
    }
};
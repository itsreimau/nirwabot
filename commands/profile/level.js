module.exports = {
    name: "level",
    aliases: ["lvl"],
    category: "profile",
    code: async (ctx) => {
        const userDb = ctx.db.user;
        await ctx.reply(ctx.format.info(`Anda berada di level ${userDb?.level} dengan ${userDb?.xp} XP dari 100 XP.`));
    }
};
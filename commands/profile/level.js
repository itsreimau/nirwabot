module.exports = {
    name: "level",
    aliases: ["lvl"],
    category: "profile",
    code: async (ctx) => {
        const userDb = ctx.db.user;
        const level = userDb?.level || 0;
        const xp = userDb?.xp || 0;
        const xpNeeded = 100;
        await ctx.reply(ctx.format.info(`Anda berada di level ${level} dengan ${xp} XP dari ${xpNeeded} XP.`));
    }
};
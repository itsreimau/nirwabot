module.exports = {
    name: "xp",
    aliases: ["exp", "experience"],
    category: "profile",
    code: async (ctx) => {
        const userDb = ctx.db.user;
        const xp = userDb?.xp || 0;
        const level = userDb?.level || 0;
        const xpNeeded = 100;
        await ctx.reply(ctx.format.info(`Anda memiliki ${xp} XP dan berada di level ${level}.`));
    }
};
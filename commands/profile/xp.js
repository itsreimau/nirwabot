module.exports = {
    name: "xp",
    aliases: ["exp", "experience"],
    category: "profile",
    code: async (ctx) => {
        const userDb = ctx.db.user;
        await ctx.reply(ctx.format.info(`Anda memiliki ${userDb?.xp} XP dan berada di level ${userDb?.level}.`));
    }
};
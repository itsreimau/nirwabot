module.exports = {
    name: "profile",
    aliases: ["me", "prof", "profil"],
    category: "profile",
    code: async (ctx) => {
        const users = ctx.db.users.getAll();
        const userDb = ctx.db.user;
        const leaderboardData = users.map(user => ({
            jid: user.jid,
            level: user.level || 0,
            winGame: user.winGame || 0
        })).sort((a, b) => b.winGame - a.winGame || b.level - a.level);

        await ctx.reply(
            `❖ ${ctx.format.bold("Nama")}: ${ctx.sender.pushName}\n` +
            `❖ ${ctx.format.bold("Status")}: ${ctx.sender.isOwner() ? "Owner" : (userDb?.premium ? `Premium (${userDb?.premiumExpiration ? `${ctx.format.convertMsToDuration(userDb.premiumExpiration - Date.now(), ["hari", "jam"])} tersisa` : "Selamanya"})` : "Freemium")}\n` +
            `❖ ${ctx.format.bold("Level")}: ${userDb?.level || 0} (${userDb?.xp || 0}/100)\n` +
            `❖ ${ctx.format.bold("Koin")}: ${ctx.sender.isOwner() || userDb?.premium ? "Unlimited" : (userDb?.coin || 0)}\n` +
            `❖ ${ctx.format.bold("Menang")}: ${userDb?.winGame || 0}\n` +
            `❖ ${ctx.format.bold("Peringkat")}: ${leaderboardData.findIndex(user => ctx.helper.areJidsSameUser(user.jid, ctx.sender.lid)) + 1}`
        );
    }
};
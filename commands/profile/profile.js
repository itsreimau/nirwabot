module.exports = {
    name: "profile",
    aliases: ["me", "prof", "profil"],
    category: "profile",
    code: async (ctx) => {
        const users = ctx.db.users.getAll();
        const senderDb = ctx.db.user;
        const maxTicket = (ctx.sender.isOwner() || senderDb.premium) ? config.system.maxTicketPremium : config.system.maxTicket;
        const leaderboardData = users.map(u => ({
            id: u.id,
            score: u.score
        })).sort((a, b) => b.score - a.score);
        const rank = leaderboardData.findIndex(u => ctx.helper.areJidsSameUser(u.id, ctx.sender.jid)) + 1;
        await ctx.reply(
            `❖ ${ctx.format.bold("Nama")}: ${ctx.sender.pushName}\n` +
            `❖ ${ctx.format.bold("Status")}: ${ctx.sender.isOwner() ? "Owner" : (senderDb.premium ? `Premium (${senderDb.premiumExpiration ? `${ctx.format.convertMsToDuration(senderDb.premiumExpiration - Date.now(), ["hari", "jam"])} tersisa` : "Selamanya"})` : "Freemium")}\n` +
            `❖ ${ctx.format.bold("Peringkat")}: ${rank}`,
            `❖ ${ctx.format.bold("Tiket")}: ${ctx.sender.isOwner() ? "Unlimited" : `${senderDb.ticket}/${maxTicket}`}\n` +
            `❖ ${ctx.format.bold("Skor")}: ${senderDb.score}`
        );
    }
};
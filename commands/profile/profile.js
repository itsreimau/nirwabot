module.exports = {
    name: "profile",
    aliases: ["me", "prof", "profil"],
    category: "profile",
    code: async (ctx) => {
        const senderDb = ctx.db.user;
        const maxTicket = (ctx.sender.isOwner() || senderDb.premium) ? config.system.maxTicketPremium : config.system.maxTicket;
        await ctx.reply(
            `❖ ${ctx.format.bold("Nama")}: ${ctx.sender.pushName}\n` +
            `❖ ${ctx.format.bold("Status")}: ${ctx.sender.isOwner() ? "Owner" : (senderDb.premium ? `Premium (${senderDb.premiumExpiration ? `${ctx.format.convertMsToDuration(senderDb.premiumExpiration - Date.now(), ["hari", "jam"])} tersisa` : "Selamanya"})` : "Freemium")}\n` +
            `❖ ${ctx.format.bold("Tiket")}: ${senderDb.ticket}/${maxTicket}\n` +
            `❖ ${ctx.format.bold("Skor")}: ${senderDb.score}`
        );
    }
};
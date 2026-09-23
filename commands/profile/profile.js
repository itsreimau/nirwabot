module.exports = {
    name: "profile",
    aliases: ["me", "prof", "profil"],
    category: "profile",
    code: async (ctx) => {
        const userDb = ctx.db.user;
        const maxTicket = (ctx.sender.isOwner() || userDb.premium) ? config.system.maxTicketPremium : config.system.maxTicket;
        await ctx.reply(
            `❖ ${ctx.format.bold("Nama")}: ${ctx.sender.pushName}\n` +
            `❖ ${ctx.format.bold("Status")}: ${ctx.sender.isOwner() ? "Owner" : (userDb.premium ? `Premium (${userDb.premiumExpiration ? `${ctx.format.convertMsToDuration(userDb.premiumExpiration - Date.now(), ["hari", "jam"])} tersisa` : "Selamanya"})` : "Freemium")}\n` +
            `❖ ${ctx.format.bold("Tiket")}: ${userDb.ticket}/${maxTicket}\n` +
            `❖ ${ctx.format.bold("Skor")}: ${userDb.score}`
        );
    }
};
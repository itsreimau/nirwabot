module.exports = {
    name: "ticket",
    aliases: ["tiket"],
    category: "profile",
    code: async (ctx) => {
        const senderDb = ctx.db.user;
        const maxTicket = (ctx.sender.isOwner() || senderDb.premium) ? config.system.maxTicketPremium : config.system.maxTicket;
        const scorePerTicket = config.system.scorePerTicket;
        await ctx.reply({
            text: `❖ ${ctx.format.bold("Tiket")}: ${senderDb.ticket}/${maxTicket}\n` +
                `❖ ${ctx.format.bold("Skor")}: ${senderDb.score}\n` +
                `❖ ${ctx.format.bold("Tukar")}: ${scorePerTicket} skor = 1 tiket`,
            buttons: [{
                text: "Tukar",
                id: `${ctx.used.prefix}exchange`
            }, {
                text: "Cek Skor",
                id: `${ctx.used.prefix}score`
            }]
        });
    }
};
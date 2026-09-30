module.exports = {
    name: "ticket",
    aliases: ["tiket"],
    category: "profile",
    code: async (ctx) => {
        const senderDb = ctx.db.user;
        const maxTicket = (ctx.sender.isOwner() || senderDb.premium) ? config.system.maxTicketPremium : config.system.maxTicket;
        await ctx.reply(ctx.format.info(`Skor: ${senderDb.score}`));
    }
};
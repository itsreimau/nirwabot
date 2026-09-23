module.exports = {
    name: "exchange",
    aliases: ["tukar"],
    category: "profile",
    code: async (ctx) => {
        const senderDb = ctx.db.user;
        const maxTicket = (ctx.sender.isOwner() || senderDb.premium) ? config.system.maxTicketPremium : config.system.maxTicket;
        const scorePerTicket = config.system.scorePerTicket;
        if (senderDb.ticket >= maxTicket) return await ctx.reply(ctx.format.info(`Tiket udah maksimal (${senderDb.ticket}/${maxTicket}). Gak bisa nambah lagi.`));
        if (senderDb.score < scorePerTicket) return await ctx.reply(ctx.format.info("Skor kurang. Main game dulu."));

        try {
            senderDb.score -= scorePerTicket;
            senderDb.ticket += 1;
            senderDb.save();
            await ctx.reply(ctx.format.info(`Tukar ${scorePerTicket} skor → 1 tiket. Tiket: ${senderDb.ticket}/${maxTicket}`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
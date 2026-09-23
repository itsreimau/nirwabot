module.exports = {
    name: "addticketuser",
    aliases: ["atu", "addticket"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const target = await ctx.target();
        const ticketAmount = parseInt(ctx.args[target.source === "quoted" ? 0 : 1], 10);
        if (!target.id || !ticketAmount)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "@6281234567891 3 -s")}\n` +
                    `${ctx.format.generateNotes([
                        "Balas/quote pesan target."
                    ])}\n` +
                    ctx.format.generatesFlagInfo({
                        "-s": "Diam, tanpa notifikasi"
                    }),
                mentions: ["6281234567891@s.whatsapp.net"]
            });
        const targetDb = ctx.getDb("users", target.id);
        const maxTicket = (ctx.sender.isOwner() || senderDb.premium) ? config.system.maxTicketPremium : config.system.maxTicket;
        if (targetDb.ticket >= maxTicket) return await ctx.reply(ctx.format.info(`Tiket udah maksimal (${targetDb.ticket}/${maxTicket}). Gak bisa nambah lagi.`));

        try {
            const flag = ctx.flag({
                silent: {
                    type: "boolean",
                    short: "s",
                    default: false
                }
            });
            targetDb.ticket += ticketAmount;
            targetDb.save();
            if (!flag.silent && !config.system.restrict) await ctx.sendMessage(target.id, ctx.format.info(`Anda menerima ${ticketAmount} ticket dari owner.`));
            await ctx.reply(ctx.format.info(`+${ticketAmount} ticket untuk target.`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
module.exports = {
    name: "donate",
    aliases: ["donasi", "support"],
    category: "information",
    code: async (ctx) => {
        try {
            const botText = ctx.db.bot.text || {};
            const qrisLink = botText?.qris || "https://files.catbox.moe/es2p23.jpeg";
            const customText = botText?.donate;
            const text = customText ? customText.replace(/%tag%/g, `@${ctx.getId(ctx.sender.jid)}`).replace(/%name%/g, config.bot.name).replace(/%prefix%/g, ctx.used.prefix).replace(/%command%/g, ctx.used.command).replace(/%footer%/g, config.msg.footer).replace(/%readmore%/g, "\u200E".repeat(4001)) :
                "❖ 083187728625 (DANA & Pulsa & Kuota)\n" +
                "❖ https://paypal.me/itsreimau (PayPal)\n" +
                "❖ https://saweria.co/itsreimau (Saweria)\n" +
                "❖ https://tako.id/itsreimau (Tako)\n" +
                "❖ https://trakteer.id/itsreimau (Trakteer)";

            await ctx.reply({
                image: {
                    url: qrisLink
                },
                caption: text,
                mentions: [ctx.sender.jid]
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
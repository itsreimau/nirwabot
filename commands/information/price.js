module.exports = {
    name: "price",
    aliases: ["belibot", "harga", "sewa", "sewabot"],
    category: "information",
    code: async (ctx) => {
        const customText = ctx.db.bot.text?.price;
        const text = customText ? customText.replace(/%tag%/g, `@${ctx.getId(ctx.sender.jid)}`).replace(/%name%/g, config.bot.name).replace(/%prefix%/g, ctx.used.prefix).replace(/%command%/g, ctx.used.command).replace(/%footer%/g, config.msg.footer).replace(/%readmore%/g, "\u200E".repeat(4001)) :
            ctx.format.info("Bot ini tidak memiliki harga.");
        await ctx.reply({
            text,
            mentions: [ctx.sender.jid]
        });
    }
};
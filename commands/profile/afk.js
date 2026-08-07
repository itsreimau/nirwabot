module.exports = {
    name: "afk",
    category: "profile",
    code: async (ctx) => {
        const input = ctx.text;
        const senderDb = ctx.db.user;
        senderDb.afk = {
            reason: input,
            timestamp: Date.now()
        };
        senderDb.save();
        await ctx.reply(ctx.format.info(`Anda akan AFK, ${input ? `dengan alasan ${ctx.format.inlineCode(input)}` : "tanpa alasan apapun"}`));
    }
};
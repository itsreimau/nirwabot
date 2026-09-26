const rewards = {
    regular: 2,
    premium: 5
};

module.exports = {
    name: "claim",
    aliases: ["bonus", "klaim"],
    category: "profile",
    code: async (ctx) => {
        const senderDb = ctx.db.user;
        const reward = (ctx.sender.isOwner() || senderDb.premium) ? rewards.premium : rewards.regular;
        const currentTime = Date.now();
        const lastClaim = senderDb.lastClaim;
        const remainingTime = (24 * 60 * 60 * 1000) - (currentTime - lastClaim);
        if (remainingTime > 0) return await ctx.reply(ctx.format.info(`Sudah klaim. Tunggu ${ctx.format.convertMsToDuration(remainingTime)}.`));

        try {
            senderDb.ticket += reward;
            senderDb.lastClaim = currentTime;
            senderDb.save();
            await ctx.reply(ctx.format.info(`Klaim ${reward} tiket. Total: ${senderDb.ticket}`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
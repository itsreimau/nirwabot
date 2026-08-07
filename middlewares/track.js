module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        const senderDb = ctx.db.user;
        const xpGain = 10;
        const xpToLevelUp = 100;
        let newSenderXp = (senderDb?.xp || 0) + xpGain;
        if (newSenderXp >= xpToLevelUp) {
            const senderLevel = senderDb?.level || 0;
            senderDb.level = senderLevel + 1;
            newSenderXp -= xpToLevelUp;
        }
        senderDb.xp = newSenderXp;
        senderDb.save();

        await next();
    });
};
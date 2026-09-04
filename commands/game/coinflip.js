module.exports = {
    name: "coinflip",
    aliases: ["flip"],
    category: "game",
    code: async (ctx) => {
        const input = ctx.args[0]?.toLowerCase();
        if (!input || !["garuda", "melati"].includes(input))
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "melati")}\n` +
                ctx.format.generateNotes([
                    "Sisi koin tersedia garuda atau melati, sama seperti koin Rp. 500."
                ])
            );

        const senderDb = ctx.db.user;
        const isUnlimited = ctx.sender.isOwner() || senderDb.premium;
        if (!isUnlimited && senderDb.coin < 500) return await ctx.reply(ctx.format.info("Koin Anda tidak cukup! Minimal memiliki 500 koin untuk bermain."));

        try {
            const winRate = 0.40;
            const isWin = Math.random() < winRate;
            const flip = isWin ? input : (input === "garuda" ? "melati" : "garuda");
            let responseText = "";
            let prizeText = "";

            if (isWin) {
                const prize = 1000;
                if (!isUnlimited) senderDb.coin += prize;
                responseText = "Selamat!";
                prizeText = `+${prize} koin`;
            } else {
                const forfeit = 500;
                if (!isUnlimited) senderDb.coin -= forfeit;
                responseText = "Kalah!";
                prizeText = `-${forfeit} koin`;
            }

            if (!isUnlimited) senderDb.save();
            await ctx.reply(ctx.format.info(`${responseText} Koin jatuh di sisi ${flip}. ${prizeText}`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
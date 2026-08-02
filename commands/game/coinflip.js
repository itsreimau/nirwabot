module.exports = {
    name: "coinflip",
    category: "game",
    permissions: {
        coin: 500
    },
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

        try {
            const senderDb = ctx.db.user;
            const isUnlimited = ctx.sender.isOwner() || senderDb?.premium;
            const flip = Math.random() < 0.5 ? "garuda" : "melati";
            const isWin = input === flip;
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
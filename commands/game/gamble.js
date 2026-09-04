module.exports = {
    name: "gamble",
    aliases: ["slot"],
    category: "game",
    code: async (ctx) => {
        const input = parseInt(ctx.args[0], 10);
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "18")
            );

        const senderDb = ctx.db.user;
        const isUnlimited = ctx.sender.isOwner() || senderDb.premium;
        if (input < 10) return await ctx.reply(ctx.format.info("Jumlah taruhan tidak boleh kurang dari 10!"));
        if (!isUnlimited && senderDb.coin < input) return await ctx.reply(ctx.format.info("Koin Anda tidak mencukupi!"));

        try {
            const jackpotPrize = Math.ceil(input * 5);
            const winPrize = Math.ceil(input * 2);
            const emojis = ["🍏", "🍎", "🍊", "🍋", "🍑", "🪙", "🍅", "🍐", "🍒", "🥥", "🍌"];

            const topRow = Array.from({
                length: 3
            }, () => emojis[Math.floor(Math.random() * emojis.length)]);
            const middleRow = Array.from({
                length: 3
            }, () => emojis[Math.floor(Math.random() * emojis.length)]);
            const bottomRow = Array.from({
                length: 3
            }, () => emojis[Math.floor(Math.random() * emojis.length)]);

            const isJackpot = middleRow[0] === middleRow[1] && middleRow[1] === middleRow[2];
            const isWin = !isJackpot && (middleRow[0] === middleRow[1] || middleRow[0] === middleRow[2] || middleRow[1] === middleRow[2]);

            const slotText = `${topRow[0]} | ${topRow[1]} | ${topRow[2]}\n` +
                `${middleRow[0]} | ${middleRow[1]} | ${middleRow[2]} <===\n` +
                `${bottomRow[0]} | ${bottomRow[1]} | ${bottomRow[2]}`;

            let responseText = "";
            if (isJackpot) {
                responseText = `Jackpot! +${jackpotPrize} koin (5x lipat)`;
                if (!isUnlimited) senderDb.coin += jackpotPrize;
            } else if (isWin) {
                responseText = `Menang! +${winPrize} koin (2x lipat)`;
                if (!isUnlimited) senderDb.coin += winPrize;
            } else {
                responseText = `Kalah! Semoga beruntung lain kali. -${input} koin`;
                if (!isUnlimited) senderDb.coin -= input;
            }

            if (!isUnlimited) senderDb.save();
            await ctx.reply(
                `${ctx.format.info(responseText)}\n` +
                slotText
            );
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
const claimRewards = {
    daily: {
        reward: 100,
        cooldown: 24 * 60 * 60 * 1000,
        level: 1
    },
    weekly: {
        reward: 500,
        cooldown: 7 * 24 * 60 * 60 * 1000,
        level: 15
    },
    monthly: {
        reward: 2000,
        cooldown: 30 * 24 * 60 * 60 * 1000,
        level: 50
    },
    yearly: {
        reward: 10000,
        cooldown: 365 * 24 * 60 * 60 * 1000,
        level: 75
    }
};

module.exports = {
    name: "claim",
    aliases: ["bonus", "klaim"],
    category: "profile",
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "daily")}\n` +
                ctx.format.generateNotes([
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`
                ])
            );

        if (input.toLowerCase() === "list") {
            const listText = await ctx.list.get(ctx, "claim");
            return await ctx.reply(listText);
        }

        const senderDb = ctx.db.user;
        const claim = claimRewards[input];
        const level = senderDb?.level || 0;

        if (!claim) return await ctx.reply(ctx.format.info("Hadiah tidak valid!"));
        if (ctx.sender.isOwner() || senderDb?.premium) return await ctx.reply(ctx.format.info("Anda sudah memiliki koin tak terbatas!"));
        if (level < claim.level) return await ctx.reply(ctx.format.info(`Anda perlu mencapai level ${claim.level} untuk mengklaim hadiah ini. Levelmu saat ini adalah ${level}.`));

        const currentTime = Date.now();
        const lastClaim = (senderDb?.lastClaim ?? {})[input] || 0;
        const remainingTime = claim.cooldown - (currentTime - lastClaim);
        if (remainingTime > 0) return await ctx.reply(ctx.format.info(`Anda telah mengklaim hadiah ${input}. Tunggu ${ctx.format.convertMsToDuration(remainingTime)} untuk mengklaim lagi.`));

        try {
            senderDb.coin = (senderDb?.coin || 0) + claim.reward;
            (senderDb.lastClaim ||= {})[input] = currentTime;
            senderDb.save();
            await ctx.reply(ctx.format.info(`Anda berhasil mengklaim hadiah ${input} sebesar ${claim.reward} koin! Koin Anda saat ini: ${senderDb.coin}`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
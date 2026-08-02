module.exports = {
    name: "perplexity",
    category: "ai",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "apa itu evangelion?")}\n` +
                ctx.format.generateNotes([
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} reset`)} untuk mereset riwayat percakapan.`
                ])
            );

        const senderDb = ctx.db.user;
        if (input.toLowerCase() === "reset") {
            (senderDb.sessionId ||= {}).perplexity = ctx.helper.randomUUID();
            senderDb.save();
            return await ctx.reply(ctx.format.info("Riwayat percakapan berhasil direset!"));
        }

        try {
            if (!senderDb.sessionId?.perplexity) {
                (senderDb.sessionId ||= {}).perplexity = ctx.helper.randomUUID();
                senderDb.save();
            }
            const apiUrl = ctx.api.createUrl("alwayscodex", "/api/ai/chatgpt-org", {
                teks: input,
                model: "perplexity/sonar",
                session: senderDb.sessionId.perplexity
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
const { randomUUID } = require("node:crypto");

module.exports = {
    name: "claude",
    category: "ai",
    permissions: {
        ticket: true
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
            (senderDb.sessionId ||= {}).claude = randomUUID();
            senderDb.save();
            return await ctx.reply(ctx.format.info("Riwayat percakapan berhasil direset!"));
        }

        try {
            if (!senderDb.sessionId?.claude) {
                (senderDb.sessionId ||= {}).claude = randomUUID();
                senderDb.save();
            }
            const apiUrl = ctx.api.createUrl("nexray", "/ai/claude", {
                text: input,
                session: senderDb.sessionId.claude
            });
            const result = (await ctx.request.get(apiUrl)).data.result;

            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
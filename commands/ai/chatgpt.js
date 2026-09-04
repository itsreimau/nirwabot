const { AIRich } = require("baileys");

module.exports = {
    name: "chatgpt",
    aliases: ["ai", "gpt"],
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
            senderDb.sessionId.chatgpt = [];
            senderDb.save();
            return await ctx.reply(ctx.format.info("Riwayat percakapan berhasil direset!"));
        }

        try {
            const apiUrl = ctx.api.createUrl("omegatech", "/api/ai/chatgpt-v2", {
                action: "chat",
                message: input,
                chatId: senderDb.sessionId?.chatgpt[0] || "",
                sessionId: senderDb.sessionId?.chatgpt[1] || ""
            });
            const result = (await ctx.request.get(apiUrl)).data.data;
            if (!senderDb.sessionId?.chatgpt) {
                senderDb.sessionId.chatgpt = [result.chatId, result.sessionId];
                senderDb.save();
            }
            await new AIRich(ctx.core).addText(result.reply).send(ctx.id);
        } catch (error) {
            senderDb.sessionId.chatgpt = [];
            senderDb.save();
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
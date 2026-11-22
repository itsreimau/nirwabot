const { MB } = require("baileys");

module.exports = {
    name: "chatgpt",
    aliases: ["ai", "gpt"],
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
                    `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} reset`)} untuk reset riwayat`
                ])
            );
        const senderDb = ctx.db.user;
        senderDb.sessionId ||= {};
        if (input.toLowerCase() === "reset") {
            senderDb.sessionId.chatgpt = [];
            senderDb.save();
            return await ctx.reply(ctx.format.info("Riwayat direset."));
        }

        try {
            const existingSession = Array.isArray(senderDb.sessionId?.chatgpt) ? senderDb.sessionId.chatgpt : [];
            const apiUrl = ctx.api.createUrl("omegatech", "/api/ai/chatgpt-v2", {
                action: "chat",
                message: input,
                chatId: existingSession[0] || "",
                sessionId: existingSession[1] || ""
            });
            const result = (await ctx.request.get(apiUrl)).data.data;
            if (!existingSession.length && result?.chatId && result?.sessionId) {
                senderDb.sessionId.chatgpt = [result.chatId, result.sessionId];
                senderDb.save();
            }
            await new MB.AIRich(ctx.core).addText(result.reply).send(ctx.id, {
                quoted: ctx.msg
            });
        } catch (error) {
            senderDb.sessionId.chatgpt = [];
            senderDb.save();
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
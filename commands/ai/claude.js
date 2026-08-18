module.exports = {
    name: "claude",
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
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} reset`)} untuk mereset riwayat percakapan.`,
                    "AI ini dapat melihat gambar."
                ])
            );

        const senderDb = ctx.db.user;
        if (input.toLowerCase() === "reset") {
            (senderDb.sessionId ||= {}).claude = ctx.helper.randomUUID();
            senderDb.save();
            return await ctx.reply(ctx.format.info("Riwayat percakapan berhasil direset!"));
        }

        try {
            if (!senderDb.sessionId?.claude) {
                (senderDb.sessionId ||= {}).claude = ctx.helper.randomUUID();
                senderDb.save();
            }

            const params = {
                text: input,
                model: "claude-haiku-4-5",
                session_id: senderDb.sessionId.claude
            };
            if (!!ctx.isMedia(["image"])) {
                const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.media.upload();
                params.image = uploadUrl;
            }
            const apiUrl = ctx.api.createUrl("alwayscodex", "/api/ai/duckai", params);
            const result = (await ctx.request.get(apiUrl)).data.result;
            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
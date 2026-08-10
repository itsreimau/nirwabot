module.exports = {
    name: "gemini",
    category: "ai",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "apa itu evangelion?")
            );
        try {
            const apiUrl = ctx.api.createUrl("alwayscodex", "/api/ai/gemini-pro", {
                teks: input
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
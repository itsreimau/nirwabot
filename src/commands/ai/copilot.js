module.exports = {
    name: "copilot",
    category: "ai",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;

        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "apa itu evangelion?")
            );

        try {
            const apiUrl = ctx.api.createUrl("nexray", "/ai/copilot", {
                text: input
            });
            const result = (await ctx.request.get(apiUrl)).data.result;

            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
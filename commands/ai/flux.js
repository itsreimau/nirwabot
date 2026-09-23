module.exports = {
    name: "flux",
    category: "ai",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "anime girl with short blue hair")
            );

        try {
            const result = ctx.api.createUrl("omegatech", "/api/ai/flux", {
                prompt: input
            });
            await ctx.reply({
                image: {
                    url: result
                },
                caption: `❖ ${ctx.format.bold("Prompt")}: ${input}`,
                buttons: [{
                    text: "Ambil Lagi",
                    id: `${ctx.used.prefix + ctx.used.command} ${input}`
                }]
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
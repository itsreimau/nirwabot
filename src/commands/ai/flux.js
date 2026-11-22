module.exports = {
    name: "flux",
    category: "ai",
    useAxios: true,
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

        const result = ctx.api.createUrl("nexray", "/ai/ideogram", {
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
    }
};
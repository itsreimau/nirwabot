module.exports = {
    name: "pinterest",
    aliases: ["pin"],
    category: "tool",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "rei ayanami")
            );

        try {
            const apiUrl = ctx.api.createUrl("varhad", "/search/pinterest", {
                query: input,
                limit: Math.floor(Math.random() * 1000) + 1
            });
            const result = ctx.helper.getRandomElement((await ctx.request.get(apiUrl)).data.result);
            await ctx.reply({
                image: {
                    url: result
                },
                caption: `❖ ${ctx.format.bold("Kueri")}: ${input}`,
                buttons: [{
                    text: "Ambil Lagi",
                    id: `${ctx.used.prefix + ctx.used.command} ${input}`
                }]
            });
        } catch (error) {
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
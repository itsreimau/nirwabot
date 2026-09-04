module.exports = {
    name: "createqrcode",
    aliases: ["createqr"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "rei ayanami")
            );
        try {
            const result = ctx.api.createUrl("kangwifi", "/tools/qrcode", {
                text: input
            });
            const result = (await ctx.request.get(apiUrl)).data.result.url;
            await ctx.reply({
                image: {
                    url: result
                }
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
module.exports = {
    name: "createqrcode",
    aliases: ["createqr"],
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
            const result = ctx.api.createUrl("faaa", "/faa/qr-create", {
                text: input
            });
            await ctx.reply({
                image: {
                    url: result
                }
            });
        } catch (error) {
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
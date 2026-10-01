module.exports = {
    name: "setname",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "nirwabot")
            );

        try {
            await ctx.group().updateSubject(input);
            await ctx.reply(ctx.format.info("Nama grup diubah."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
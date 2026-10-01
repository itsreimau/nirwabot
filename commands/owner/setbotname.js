module.exports = {
    name: "setbotname",
    aliases: ["setnamebot"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "nirwabot")
            );

        try {
            await ctx.core.updateProfileName(input);
            await ctx.reply(ctx.format.info("Nama bot diubah."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
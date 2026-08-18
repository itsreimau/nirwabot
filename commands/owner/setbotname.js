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
            await ctx.group().updateProfileName(input);
            await ctx.reply(ctx.format.info("Berhasil mengubah nama grup!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
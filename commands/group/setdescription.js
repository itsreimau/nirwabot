module.exports = {
    name: "setdescription",
    aliases: ["setdesc"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "by itsreimau")
            );
        try {
            await ctx.group().updateDescription(input);
            await ctx.reply(ctx.format.info("Berhasil mengubah deskripsi grup!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
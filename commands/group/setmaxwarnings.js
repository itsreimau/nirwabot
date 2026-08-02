module.exports = {
    name: "setmaxwarnings",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const input = parseInt(ctx.args[0], 10);
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "8")
            );
        try {
            const groupDb = ctx.db.group;
            groupDb.maxwarnings = input;
            groupDb.save();
            await ctx.reply(ctx.format.info("Berhasil mengubah max warnings!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
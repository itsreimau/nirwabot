module.exports = {
    name: "setmaxwarnings",
    aliases: ["setmaxwarn"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const input = Number(ctx.args[0]);
        if (isNaN(input) || input < 1)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "8")
            );

        const groupDb = ctx.db.group;
        groupDb.maxwarnings = input;
        groupDb.save();
        await ctx.reply(ctx.format.info("Max warnings diubah."));
    }
};
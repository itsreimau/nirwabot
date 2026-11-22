module.exports = {
    name: "getinput",
    aliases: ["input"],
    category: "misc",
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "rei ayanami")
            );
        await ctx.reply(input);
    }
};
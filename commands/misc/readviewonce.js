module.exports = {
    name: "readviewonce",
    aliases: ["rvo"],
    category: "misc",
    code: async (ctx) => {
        if (!ctx.isMedia(["audio", "image", "video"], ["quoted"])) return await ctx.reply(ctx.format.generateInstruction(["reply"], ["audio", "image", "video"]));
        const quotedMessage = ctx.quoted.message;
        if (!quotedMessage[ctx.quoted.getMessageType()].viewOnce) return await ctx.reply(ctx.format.generateInstruction(["reply"], ["viewOnce"]));

        try {
            delete quotedMessage[ctx.quoted.getMessageType()].viewOnce;
            await ctx.sendMessage(ctx.id, {
                ...quotedMessage,
                raw: true
            });
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
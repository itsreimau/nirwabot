module.exports = {
    name: "setbotcover",
    aliases: ["setcoverbot"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const buffer = await ctx.msg.media.download() || await ctx.quoted.media.download();
            await ctx.core.updateCoverPhoto(buffer);
            await ctx.reply(ctx.format.info("Cover bot diubah."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
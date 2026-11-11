module.exports = {
    name: "setbotpp",
    aliases: ["setppbot"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const buffer = await ctx.msg.media.download() || await ctx.quoted.msg.media.download();
            const image = ctx.msg.message.imageMessage || ctx.quoted.msg.message.imageMessage;
            const dimensions = ctx.helper.calculateDimensions(image.width, image.height);
            await ctx.core.updateProfilePicture(ctx.me.id, buffer, dimensions);
            await ctx.reply(ctx.format.info("PP bot diubah."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
module.exports = {
    name: "setpp",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const buffer = await ctx.msg.media.download() || await ctx.quoted.media.download();
            const image = ctx.msg.message.imageMessage || ctx.quoted.message.imageMessage;
            const dimensions = ctx.helper.calculateDimensions(image.width, image.height);
            await ctx.group().updateProfilePicture(buffer, dimensions);
            await ctx.reply(ctx.format.info("PP grup diubah."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
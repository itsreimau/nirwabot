module.exports = {
    name: "sticker",
    aliases: ["s", "stiker"],
    category: "converter",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image", "video"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image", "video"]));
        try {
            const buffer = await ctx.msg.media.download() || await ctx.quoted.media.download();
            const [packname, author] = ctx.text?.split("|") || [];
            await ctx.reply({
                sticker: buffer
            }, {
                pack: packname || config.sticker.packname,
                author: author || config.sticker.author
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
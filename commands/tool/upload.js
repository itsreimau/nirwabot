module.exports = {
    name: "upload",
    aliases: ["up", "tourl"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["audio", "document", "image", "sticker", "video"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["audio", "document", "image", "sticker", "video"]));
        try {
            const result = await ctx.msg.media.upload() || await ctx.quoted.media.upload();
            await ctx.reply({
                text: `❖ ${ctx.format.bold("URL")}: ${result}`,
                footer: ctx.format.info("File akan kedaluwarsa setelah 3 jam."),
                nativeFlow: [{
                    text: "Salin URL",
                    copy: result
                }]
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
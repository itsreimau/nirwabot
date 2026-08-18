module.exports = {
    name: "stickerwm",
    aliases: ["take", "swm", "stikerwm"],
    category: "converter",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send", "reply"], ["text", "sticker"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "stiker saya|itsreimau")
            );
        if (!ctx.isMedia(["sticker"], ["quoted"])) return await ctx.reply(ctx.format.generateInstruction(["reply"], ["sticker"]));

        try {
            const buffer = await ctx.msg.media.download() || await ctx.quoted.media.download();
            const [packname, author] = input.split("|");
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
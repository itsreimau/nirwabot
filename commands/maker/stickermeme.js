module.exports = {
    name: "stickermeme",
    aliases: ["smeme", "stikermeme"],
    category: "maker",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input) return await ctx.reply(
            `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
            ctx.format.generateCmdExample(ctx.used, "get in the fucking robot|shinji!")
        );
        if (!ctx.isMedia(["image", "sticker"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image", "sticker"]));

        try {
            let [top, bottom] = input.split("|").map(inp => inp);
            [top, bottom] = bottom ? [top || " ", bottom] : [" ", top || " "];
            const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.media.upload();
            const result = ctx.api.createUrl("nexray", "/maker/smeme", {
                text_atas: top,
                text_bawah: bottom,
                background: uploadUrl
            });
            await ctx.reply({
                sticker: {
                    url: result
                }
            }, {
                pack: config.sticker.packname,
                author: config.sticker.author
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
module.exports = {
    name: "stickermeme",
    aliases: ["smeme", "stikermeme"],
    category: "maker",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "get in the fucking robot|shinji!")
            );
        if (!ctx.isMedia(["image", "sticker"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image", "sticker"]));

        try {
            let [top, bottom] = input.split("|").map(inp => inp);
            [top, bottom] = bottom ? [top || "_", bottom] : ["_", top || "_"];
            const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.media.upload();
            const result = ctx.api.createUrl("https://api.memegen.link", `/images/custom/${top}/${bottom}.jpg`, {
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
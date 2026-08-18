module.exports = {
    name: "ocr",
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.media.upload();
            const apiUrl = ctx.api.createUrl("nexray", "/tools/ocr", {
                url: uploadUrl
            });
            const result = (await ctx.request.get(apiUrl)).data.result.text;
            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
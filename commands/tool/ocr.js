module.exports = {
    name: "ocr",
    category: "tool",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.media.upload();
            const apiUrl = ctx.api.createUrl("moondrowend", "/api/tools/ocr", {
                url: uploadUrl
            });
            const result = (await ctx.request.get(apiUrl)).data.data;
            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
module.exports = {
    name: "hd",
    category: "tool",
    permissions: {
        coin: 20
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const uploadUrl = await ctx.msg.upload() || await ctx.quoted.upload();
            const result = ctx.api.createUrl("alwayscodex", "/api/imagehd/ai-enhance", {
                url: uploadUrl
            });
            await ctx.reply({
                image: {
                    url: result
                }
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
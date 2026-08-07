module.exports = [{
    name: "hd",
    category: "tool",
    permissions: {
        coin: 10
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
}, {
    name: "hdvideo",
    aliases: ["hdvid"],
    category: "tool",
    permissions: {
        premium: true
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["video"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["video"]));
        try {
            const uploadUrl = await ctx.msg.upload() || await ctx.quoted.upload();
            const apiUrl = ctx.api.createUrl("nexray", "/tools/v1/hdvideo", {
                url: uploadUrl
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            await ctx.reply({
                video: {
                    url: result
                }
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
}];
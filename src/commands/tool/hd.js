module.exports = [{
    name: "hd",
    category: "tool",
    useAxios: true,
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.msg.media.upload();
        const result = ctx.api.createUrl("delirius", "/ia/upscale", {
            url: uploadUrl
        });
        await ctx.reply({
            image: {
                url: result
            }
        });
    }
}, {
    name: "hdvideo",
    aliases: ["hdvid"],
    category: "tool",
    useAxios: true,
    permissions: {
        ticket: true,
        premium: true
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["video"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["video"]));
        const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.msg.media.upload();
        const apiUrl = ctx.api.createUrl("nexray", "/tools/v1/hdvideo", {
            url: uploadUrl
        });
        const result = (await ctx.request.get(apiUrl)).data.result;
        await ctx.reply({
            video: {
                url: result
            }
        });
    }
}];
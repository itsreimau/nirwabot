module.exports = {
    name: "ocr",
    category: "tool",
    useAxios: true,
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.msg.media.upload();
        const apiUrl = ctx.api.createUrl("nexray", "/tools/ocr", {
            url: uploadUrl
        });
        const result = (await ctx.request.get(apiUrl)).data.result.text;
        await ctx.reply(result);
    }
};
module.exports = {
    name: "scanqrcode",
    aliases: ["scanqr"],
    category: "tool",
    useAxios: true,
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.msg.media.upload();
        const apiUrl = ctx.api.createUrl("faaa", "/faa/qr-detect", {
            url: uploadUrl
        });
        const result = (await ctx.request.get(apiUrl)).data.result;
        await ctx.reply(result);
    }
};
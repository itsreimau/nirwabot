module.exports = {
    name: "scanqrcode",
    aliases: ["scanqr"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.media.upload();
            const result = ctx.api.createUrl("kangwifi", "/tools/qrcode", {
                url: input
            });
            const result = (await ctx.request.get(apiUrl)).data.result.content;
            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
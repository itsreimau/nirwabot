module.exports = {
    name: "removebackground",
    aliases: ["removebg"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.media.upload();
            const result = ctx.api.createUrl("nexray", "/tools/removebg", {
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
module.exports = {
    name: "removebackground",
    aliases: ["removebg"],
    category: "tool",
    permissions: {
        coin: 15
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const uploadUrl = await ctx.msg.upload() || await ctx.quoted.upload();
            const result = ctx.api.createUrl("nexray", "/tools/removebg", {
                url: uploadUrl
            });
            await ctx.reply({
                document: {
                    url: result
                },
                fileName: `${Math.random().toString(36).substring(2, 15)}.png`,
                mimetype: "image/png"
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
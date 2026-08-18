module.exports = {
    name: "tovideo",
    aliases: ["tomp4", "tovid"],
    category: "converter",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["sticker"], ["quoted"])) return await ctx.reply(ctx.format.generateInstruction(["reply"], ["sticker"]));
        try {
            const buffer = await ctx.quoted.media.download();
            const result = (await ctx.request.post("https://nekochii-converter.hf.space/webp2mp4", {
                file: buffer.toString("base64"),
                json: true
            })).data.result;
            await ctx.reply({
                video: {
                    url: result
                }
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
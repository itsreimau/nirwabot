module.exports = {
    name: "toaudio",
    aliases: ["toaud", "tomp3"],
    category: "converter",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        if (!ctx.isMedia(["video"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["video"]));
        try {
            const buffer = await ctx.msg.media.download() || await ctx.quoted.media.download();
            const result = (await ctx.request.post("https://nekochii-converter.hf.space/mp4tomp3", {
                file: buffer.toString("base64"),
                json: true
            })).data.result;
            await ctx.reply({
                audio: {
                    url: result
                },
                mimetype: "audio/mpeg"
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
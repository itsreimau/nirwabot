module.exports = {
    name: "nanobanana",
    aliases: ["nano"],
    category: "ai",
    permissions: {
        premium: true
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "make it evangelion art style")
            );
        if (!ctx.isMedia(["image"])) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const uploadUrl = await ctx.msg.media.upload() || await ctx.quoted.media.upload();
            const apiUrl = ctx.api.createUrl("lea", "/aitools/img2prompt", {
                img: uploadUrl,
                prompt: input
            });
            const result = (await ctx.request.get(apiUrl)).data.data.image_url;
            await ctx.reply({
                image: {
                    url: result
                },
                caption: `❖ ${ctx.format.bold("Prompt")}: ${input}`
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
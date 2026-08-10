module.exports = {
    name: "nanobanana",
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
            const uploadUrl = await ctx.msg.upload() || await ctx.quoted.upload();
            const result = ctx.api.createUrl("faaa", "/faa/nano-banana", {
                url: uploadUrl,
                prompt: input
            });
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
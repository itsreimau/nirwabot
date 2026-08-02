module.exports = {
    name: "pinterestdl",
    aliases: ["pindl"],
    category: "downloader",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const url = ctx.args[0] || ctx.helper.extractUrlFromText(ctx.quoted?.body);
        if (!url)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "https://id.pinterest.com/pin/843580573994363210")
            );
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        try {
            const apiUrl = ctx.api.createUrl("nexray", "/downloader/pinterest", {
                url
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            await ctx.reply({
                [result.image ? "image" : "video"]: {
                    url: result.image || result.video
                },
                caption: `❖ ${ctx.format.bold("URL")}: ${url}`
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
module.exports = {
    name: "facebookdl",
    aliases: ["facebook", "fb", "fbdl"],
    category: "downloader",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const url = ctx.args[0] || ctx.helper.extractUrlFromText(ctx.quoted?.body);
        if (!url)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "https://www.facebook.com/reel/2796711250580249")
            );
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        try {
            const apiUrl = ctx.api.createUrl("mikako", "/api/fb", {
                url
            });
            const result = (await ctx.request.get(apiUrl)).data.data;
            await ctx.reply({
                video: {
                    url: result.videoUrl[0].url
                },
                caption: `❖ ${ctx.format.bold("URL")}: ${url}`
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
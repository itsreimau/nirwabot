module.exports = {
    name: "tiktokdl",
    aliases: ["tiktok", "tt", "ttdl", "vt", "vtdl"],
    category: "downloader",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const url = ctx.args[0] || ctx.helper.extractUrlFromText(ctx.quoted?.body);
        if (!url)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "https://www.tiktok.com/@netflixanime/video/7596931111805078805")
            );
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        try {
            const apiUrl = ctx.api.createUrl("nexray", "/downloader/tiktok", {
                url
            });
            const result = (await ctx.request.get(apiUrl)).data.result.data;
            if (!Array.isArray(result)) {
                await ctx.reply({
                    video: {
                        url: result
                    },
                    caption: `❖ ${ctx.format.bold("URL")}: ${url}`
                });
            } else {
                const album = result.map(res => ({
                    image: {
                        url: res
                    }
                }));
                await ctx.reply({
                    album,
                    caption: `❖ ${ctx.format.bold("URL")}: ${url}`
                });
            }
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
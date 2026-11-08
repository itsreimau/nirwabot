const config = require("../../runtime/config");

module.exports = {
    name: "tiktokdl",
    aliases: ["tiktok", "tt", "ttdl"],
    category: "downloader",
    permissions: {
        ticket: true
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
            const apiUrl = ctx.api.createUrl("delirius", "/download/tiktok", {
                url
            });
            const result = (await ctx.request.get(apiUrl)).data.data.meta.media[0];
            const caption = `❖ ${ctx.format.bold("URL")}: ${url}`;
            if (result.type === "video") {
                await ctx.reply({
                    video: {
                        url: result.org
                    },
                    caption
                });
            } else {
                await ctx.reply({
                    album: result.images.map(res => ({
                        image: {
                            url: res
                        }
                    })),
                    caption
                });
            }
        } catch (error) {
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
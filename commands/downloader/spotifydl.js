module.exports = {
    name: "spotifydl",
    aliases: ["spotidl"],
    category: "downloader",
    permissions: {
        coin: 15
    },
    code: async (ctx) => {
        const flag = ctx.flag({
            document: {
                type: "boolean",
                short: "d",
                default: false
            }
        });
        const url = flag.input || ctx.helper.extractUrlFromText(ctx.quoted?.body);
        if (!url)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "https://open.spotify.com/track/5RhWszHMSKzb7KiXk4Ae0M")}\n` +
                ctx.format.generatesFlagInfo({
                    "-d": "Kirim sebagai dokumen"
                })
            );
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        try {
            const apiUrl = ctx.api.createUrl("alwayscodex", "/api/downloader/spotify", {
                url
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            const content = flag.document ? {
                document: {
                    url: result.download_url
                },
                fileName: `${result.title}.mp3`,
                mimetype: "audio/mpeg",
                caption: `❖ ${ctx.format.bold("URL")}: ${url}`
            } : {
                audio: {
                    url: result.download_url
                },
                mimetype: "audio/mpeg"
            };
            await ctx.reply(content);
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
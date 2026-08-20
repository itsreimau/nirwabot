module.exports = {
    name: "play",
    category: "downloader",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const flag = ctx.flag({
            index: {
                type: "string",
                short: "i",
                default: "0"
            },
            source: {
                type: "string",
                short: "s",
                default: "youtube"
            }
        });
        const input = flag.input;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "one last kiss - hikaru utada -i 8 -s spotify")}\n` +
                ctx.format.generatesFlagInfo({
                    "-i <number>": "Pilihan pada data indeks",
                    "-s <text>": "Sumber untuk memutar lagu (tersedia: spotify, youtube | default: youtube)"
                })
            );

        try {
            const searchIndex = parseInt(flag.index, 10);
            const source = flag.source;
            let searchResult = "";
            let downloadResult = "";

            if (source === "spotify") {
                const searchApiUrl = ctx.api.createUrl("sanka", "/search/spotify", {
                    q: input
                }, "apikey");
                searchResult = (await ctx.request.get(searchApiUrl)).data.result[searchIndex];
                await ctx.reply(
                    `❖ ${ctx.format.bold("Judul")}: ${searchResult.title}\n` +
                    `❖ ${ctx.format.bold("Artis")}: ${searchResult.artist}\n` +
                    `❖ ${ctx.format.bold("URL")}: ${searchResult.track_url}`
                );
                const downloadApiUrl = ctx.api.createUrl("mikako", "/api/spotify", {
                    url: searchResult.track_url
                });
                downloadResult = (await ctx.request.get(downloadApiUrl)).data.data.download;
            } else {
                const searchApiUrl = ctx.api.createUrl("sanka", "/search/youtube", {
                    q: input
                }, "apikey");
                searchResult = (await ctx.request.get(searchApiUrl)).data.result;
                const filterResult = searchResult.filter(vid => vid.type === "video")
                const result = filterResult[searchIndex]
                await ctx.reply(
                    `❖ ${ctx.format.bold("Judul")}: ${result.title}\n` +
                    `❖ ${ctx.format.bold("Artis")}: ${result.author.name}\n` +
                    `❖ ${ctx.format.bold("URL")}: ${result.url}`
                );
                const downloadApiUrl = ctx.api.createUrl("mikako", "/api/ytmp3", {
                    url: result.url,
                    type: "MP3"
                });
                downloadResult = (await ctx.request.get(downloadApiUrl)).data.data.download_url;
            }

            if (config.system.autoTypingOnCmd) await ctx.simulateTyping()
            await ctx.reply({
                audio: {
                    url: downloadResult
                },
                mimetype: "audio/mpeg"
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
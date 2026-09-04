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
                const searchApiUrl = ctx.api.createUrl("zellrayy", "/search/spotify", {
                    q: input
                });
                searchResult = (await ctx.request.get(searchApiUrl)).data.result[searchIndex];
                await ctx.reply(
                    `❖ ${ctx.format.bold("Judul")}: ${searchResult.title}\n` +
                    `❖ ${ctx.format.bold("Artis")}: ${searchResult.artist}\n` +
                    `❖ ${ctx.format.bold("URL")}: ${searchResult.spotifyUrl}`
                );
                const downloadApiUrl = ctx.api.createUrl("nexray", "/downloader/spotify", {
                    url: searchResult.spotifyUrl
                });
                downloadResult = (await ctx.request.get(downloadApiUrl)).data.result.url;
            } else {
                const searchApiUrl = ctx.api.createUrl("zellrayy", "/search/youtube", {
                    q: input
                });
                searchResult = (await ctx.request.get(searchApiUrl)).data.result[searchIndex];
                await ctx.reply(
                    `❖ ${ctx.format.bold("Judul")}: ${searchResult.title}\n` +
                    `❖ ${ctx.format.bold("Artis")}: ${searchResult.channel.name}\n` +
                    `❖ ${ctx.format.bold("URL")}: ${searchResult.url}`
                );
                const downloadApiUrl = ctx.api.createUrl("nexray", "/downloader/savetube", {
                    url: searchResult.url,
                    quality: "mp3"
                });
                downloadResult = (await ctx.request.get(downloadApiUrl)).data.result.url;
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
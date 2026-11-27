const config = require("../../runtime/config");

module.exports = {
    name: "play",
    category: "downloader",
    useAxios: true,
    permissions: {
        ticket: true
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
                    "-i <number>": "Indeks hasil",
                    "-s <text>": "Sumber: spotify, youtube (default: youtube)"
                })
            );

        const searchIndex = Number(flag.index);
        let downloadUrl;
        if (flag.source === "spotify") {
            const searchApiUrl = ctx.api.createUrl("zellrayy", "/search/spotify", {
                q: input
            });
            const searchResult = (await ctx.request.get(searchApiUrl)).data.result?.[searchIndex];
            if (!searchResult) return await ctx.reply(ctx.format.info(config.msg.notFound));
            await ctx.reply(
                `❖ ${ctx.format.bold("Judul")}: ${searchResult.title}\n` +
                `❖ ${ctx.format.bold("Artis")}: ${searchResult.artist}\n` +
                `❖ ${ctx.format.bold("URL")}: ${searchResult.spotifyUrl}`
            );
            const downloadApiUrl = ctx.api.createUrl("nexray", "/downloader/aio", {
                url: searchResult.spotifyUrl
            });
            const downloadData = (await ctx.request.get(downloadApiUrl)).data.result;
            downloadUrl = downloadData.medias?.find(item => item.type === "audio")?.url || downloadData.medias?.[0]?.url;
        } else {
            const searchApiUrl = ctx.api.createUrl("zellrayy", "/search/youtube", {
                q: input
            });
            const searchResult = (await ctx.request.get(searchApiUrl)).data.result?.[searchIndex];
            if (!searchResult) return await ctx.reply(ctx.format.info(config.msg.notFound));
            await ctx.reply(
                `❖ ${ctx.format.bold("Judul")}: ${searchResult.title}\n` +
                `❖ ${ctx.format.bold("Artis")}: ${searchResult.channel.name}\n` +
                `❖ ${ctx.format.bold("URL")}: ${searchResult.url}`
            );
            const downloadApiUrl = ctx.api.createUrl("nexray", "/downloader/ytmp3", {
                url: searchResult.url
            });
            downloadUrl = (await ctx.request.get(downloadApiUrl)).data.result.url;
        }
        if (config.system.autoTypingOnCmd) await ctx.simulateTyping();
        await ctx.reply({
            audio: {
                url: downloadUrl
            },
            mimetype: "audio/mpeg"
        });
    }
};
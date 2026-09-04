module.exports = {
    name: "youtubesearch",
    aliases: ["youtube", "youtubes", "yt", "yts", "ytsearch"],
    category: "search",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "one last kiss - hikaru utada")
            );

        if (ctx.helper.isUrl(input))
            return await ctx.reply({
                text: ctx.format.info("Input berupa URL, gunakan tombol download di bawah:"),
                buttons: [{
                    text: "Download Audio",
                    id: `${ctx.used.prefix}youtubeaudio ${input}`
                }, {
                    text: "Download Video",
                    id: `${ctx.used.prefix}youtubevideo ${input}`
                }]
            });

        try {
            const apiUrl = ctx.api.createUrl("zellrayy", "/search/youtube", {
                q: input
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            const resultText = result.map(res =>
                `❖ ${ctx.format.bold("Judul")}: ${res.title}\n` +
                `❖ ${ctx.format.bold("Channel")}: ${res.channel.name}\n` +
                `❖ ${ctx.format.bold("URL")}: ${res.url}`
            ).join("\n\n");
            await ctx.reply(resultText.trim() || ctx.format.info(config.msg.notFound));
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
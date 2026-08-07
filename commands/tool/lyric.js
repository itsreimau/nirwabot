module.exports = {
    name: "lyric",
    aliases: ["lirik"],
    category: "tool",
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
        try {
            const apiUrl = ctx.api.createUrl("nexray", "/search/lyrics", {
                q: input
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            await ctx.reply(
                `✦ — ${result.lyrics.plain_lyrics}\n` +
                "\n" +
                `❖ ${ctx.format.bold("Judul")}: ${result.title}\n` +
                `❖ ${ctx.format.bold("Artis")}: ${result.artists}`
            );
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
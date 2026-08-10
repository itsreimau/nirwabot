module.exports = {
    name: "instagramdl",
    aliases: ["ig", "igdl", "instagram"],
    category: "downloader",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const url = ctx.args[0] || ctx.helper.extractUrlFromText(ctx.quoted?.body);
        if (!url)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "https://www.instagram.com/p/DVKVfnVjyep")
            );
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        try {
            const apiUrl = ctx.api.createUrl("nexray", "/downloader/instagram", {
                url
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            const album = result.map(res => ({
                [res.type]: {
                    url: res.url
                }
            }));
            await ctx.reply({
                album,
                caption: `❖ ${ctx.format.bold("URL")}: ${url}`
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
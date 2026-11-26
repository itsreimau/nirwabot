const config = require("../../runtime/config");

module.exports = {
    name: "spotifydl",
    aliases: ["spotidl"],
    category: "downloader",
    useAxios: true,
    permissions: {
        ticket: true
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

        const apiUrl = ctx.api.createUrl("nexray", "/downloader/aio", {
            url
        });
        const data = (await ctx.request.get(apiUrl)).data.result;
        const result = {
            url: data.medias?.find(item => item.type === "audio")?.url || data.medias?.[0]?.url,
            title: data.title
        };
        const content = flag.document ? {
            document: {
                url: result.url
            },
            fileName: `${result.title}.mp3`,
            mimetype: "audio/mpeg",
            caption: `❖ ${ctx.format.bold("URL")}: ${url}`
        } : {
            audio: {
                url: result.url
            },
            mimetype: "audio/mpeg"
        };
        await ctx.reply(content);
    }
};
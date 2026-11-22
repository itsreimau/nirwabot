const config = require("../../runtime/config");

const buildUsage = async (ctx) =>
    await ctx.reply(
        `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
        `${ctx.format.generateCmdExample(ctx.used, "https://www.youtube.com/watch?v=0Uhh62MUEic -d")}\n` +
        ctx.format.generatesFlagInfo({
            "-d": "Kirim sebagai dokumen"
        })
    );

module.exports = [{
    name: "youtubeaudio",
    aliases: ["yta", "ytaudio", "ytmp3"],
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
        if (!url) return await buildUsage(ctx);
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        const apiUrl = ctx.api.createUrl("nexray", "/downloader/ytmp3", {
            url
        });
        const result = (await ctx.request.get(apiUrl)).data.result;
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
}, {
    name: "youtubevideo",
    aliases: ["ytmp4", "ytv", "ytvideo"],
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
        if (!url) return await buildUsage(ctx);
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        const apiUrl = ctx.api.createUrl("zellrayy", "/download/youtube", {
            url
        });
        const result = (await ctx.request.get(apiUrl)).data.result;
        const content = flag.document ? {
            document: {
                url: result.download
            },
            fileName: `${result.title}.mp4`,
            mimetype: "video/mp4",
            caption: `❖ ${ctx.format.bold("URL")}: ${url}`
        } : {
            video: {
                url: result.download
            },
            caption: `❖ ${ctx.format.bold("URL")}: ${url}`
        };
        await ctx.reply(content);
    }
}];
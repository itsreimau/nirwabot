const util = require("node:util");

module.exports = {
    name: "fetch",
    aliases: ["f", "get"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const url = ctx.args[0] || ctx.helper.extractUrlFromText(ctx.quoted?.body);
        if (!url)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "https://itsreimau.is-a.dev")
            );
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        try {
            const response = await ctx.request.get(url, {
                responseType: "arraybuffer",
                validateStatus: () => true
            });
            const contentType = response?.headers?.["content-type"] || "";
            const data = response?.data;

            if (/webp/.test(contentType)) {
                await ctx.reply({
                    sticker: data
                }, {
                    pack: config.sticker.packname,
                    author: config.sticker.author
                });
            } else if (/image/.test(contentType)) {
                await ctx.reply({
                    image: data,
                    mimetype: contentType
                });
            } else if (/video/.test(contentType)) {
                await ctx.reply({
                    video: data,
                    mimetype: contentType
                });
            } else if (/audio/.test(contentType)) {
                await ctx.reply({
                    audio: data,
                    mimetype: contentType
                });
            } else if (!/text|json|html|plain|utf-8/i.test(contentType)) {
                let fileName = "";
                const contentDisposition = response?.headers?.["content-disposition"];
                if (contentDisposition && /filename/i.test(contentDisposition)) {
                    const match = contentDisposition.match(/filename[=*]?["']?(.*?)["']?[;]?$/i);
                    fileName = match?.[1]?.replace(/["';]/g, "") || "";
                }
                await ctx.reply({
                    document: data,
                    fileName,
                    mimetype: contentType
                });
            } else {
                await ctx.reply(ctx.format.monospace(util.inspect(data, {
                    depth: null,
                    maxArrayLength: null,
                    maxStringLength: null
                })));
            }
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
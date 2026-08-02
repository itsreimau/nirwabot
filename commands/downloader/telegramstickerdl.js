const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) chunks.push(array.slice(i, i + chunkSize));
    return chunks;
};

const prepareStickerPack = (stickers, title, name, packId) => {
    const maxPerPack = 30;
    const stickerChunks = chunkArray(stickers, maxPerPack);
    return stickerChunks.map((chunk, index) => ({
        stickerPack: {
            name: `${title}${stickerChunks.length > 1 ? ` (${index + 1}/${stickerChunks.length})` : ""}`,
            publisher: config.bot.name,
            description: `t.me/${name}`,
            cover: stickerChunks[0][0].url,
            stickers: chunk.map((sticker, i) => ({
                data: sticker.url,
                emojis: [sticker.emoji],
                id: packId,
                quality: 50
            }))
        }
    }));
};

module.exports = {
    name: "telegramstickerdl",
    aliases: ["telesticker", "telegramsticker"],
    category: "downloader",
    permissions: {
        premium: true
    },
    code: async (ctx) => {
        const url = ctx.args[0] || ctx.helper.extractUrlFromText(ctx.quoted?.body);
        if (!url)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "https://t.me/addstickers/ReiAyanamiEvangelionCute")
            );
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        try {
            const apiUrl = ctx.api.createUrl("nexray", "/tools/telegram-sticker", {
                url
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            const stickerPacks = prepareStickerPack(result.sticker, result.title, result.name, ctx.msg.key.id);
            for (const stickerPack of stickerPacks) {
                await ctx.reply({
                    stickerPack
                }, {
                    pack: config.sticker.packname,
                    author: config.sticker.author
                });
            }
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
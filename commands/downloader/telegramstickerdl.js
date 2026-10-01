const chunkArray = (array, size) =>
    Array.from({
        length: Math.ceil(array.length / size)
    }, (_, i) => array.slice(i * size, i * size + size));

const prepareStickerPacks = (stickers, title, name, packId) => {
    const chunks = chunkArray(stickers.filter(sticker => !sticker.is_animated), 60);
    return chunks.map((chunk, index) => ({
        name: title,
        publisher: config.bot.name,
        description: `${name}${chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : ""}`,
        cover: chunk[0]?.url,
        stickers: chunk.map(sticker => ({
            data: sticker.url,
            emojis: [sticker.emoji],
            id: packId
        }))
    }));
};

module.exports = {
    name: "telegramstickerdl",
    aliases: ["telegramsticker", "telesticker", "telestickerdl"],
    category: "downloader",
    permissions: {
        ticket: true,
        premium: true
    },
    code: async (ctx) => {
        const url = ctx.args[0] || ctx.helper.extractUrlFromText(ctx.quoted?.body);
        if (!url)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "https://t.me/addstickers/reigalaxybllue")
            );
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));

        try {
            const apiUrl = ctx.api.createUrl("nexray", "/tools/telegram-sticker", {
                url
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            const stickerPacks = prepareStickerPacks(result.sticker, result.title, result.name, ctx.msg.key.id);
            if (!stickerPacks.length) return await ctx.reply(config.msg.notFound);
            for (const stickerPack of stickerPacks)
                await ctx.reply({
                    stickerPack
                }, {
                    pack: config.sticker.packname,
                    author: config.sticker.author
                });
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
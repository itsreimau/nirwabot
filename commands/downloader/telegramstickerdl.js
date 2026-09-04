const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) chunks.push(array.slice(i, i + chunkSize));
    return chunks;
};

const prepareStickerPacks = (stickers, title, name, packId) => {
    const maxPerPack = 60;
    const chunks = chunkArray(stickers, maxPerPack);
    return chunks.filter(chunk => !chunk.is_animated).map((chunk, index) => ({
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
            const stickerPacks = prepareStickerPacks(ctx, result.sticker, result.title, result.name, ctx.msg.key.id);
            if (stickerPacks.length === 0) return await ctx.reply(config.msg.notFound);
            for (let i = 0; i < stickerPacks.length; i++) {
                const stickerPack = stickerPacks[i];
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
module.exports = [{
    name: "emojigif",
    aliases: ["egif"],
    category: "maker",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const [emoji] = Array.from(ctx.text?.matchAll(/\p{Emoji}/gu), (match) => match[0]).slice(0, 1);
        if (!emoji)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "😱")
            );
        try {
            const result = ctx.api.createUrl("nexray", "/tools/emojigif", {
                emoji
            });
            await ctx.reply({
                sticker: {
                    url: result
                }
            }, {
                pack: config.sticker.packname,
                author: config.sticker.author
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
}, {
    name: "emojimix",
    aliases: ["emix"],
    category: "maker",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const [emoji1, emoji2] = Array.from(ctx.text?.matchAll(/\p{Emoji}/gu), (match) => match[0]).slice(0, 2);
        if (!emoji1 || !emoji2)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "😱 🤓")
            );
        try {
            const result = ctx.api.createUrl("nexray", "/tools/emojimix", {
                emoji1,
                emoji2
            });
            await ctx.reply({
                sticker: {
                    url: result
                }
            }, {
                pack: config.sticker.packname,
                author: config.sticker.author
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
}];
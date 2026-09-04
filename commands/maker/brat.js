module.exports = [{
    name: "brat",
    aliases: ["br"],
    category: "maker",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "get in the fucking robot, shinji!")
            );
        if (input.length > 1000) return await ctx.reply(ctx.format.info("Maksimal 1000 karakter!"));
        try {
            const result = ctx.api.createUrl("zellrayy", "/maker/brat", {
                q: input
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
    name: "bratgif",
    aliases: ["brv", "bratvid", "bratvideo"],
    category: "maker",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "get in the fucking robot, shinji!")
            );
        if (input.length > 1000) return await ctx.reply(ctx.format.info("Maksimal 1000 karakter!"));
        try {
            const result = ctx.api.createUrl("zellrayy", "/maker/bratvid", {
                q: input
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
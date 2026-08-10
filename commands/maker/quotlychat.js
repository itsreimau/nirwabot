module.exports = {
    name: "quotlychat",
    aliases: ["qc", "quotly"],
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
            const isQuoted = !ctx.text && ctx.quoted;
            const profilePictureUrl = await ctx.core.profilePictureUrl(isQuoted ? ctx.quoted?.sender : ctx.sender.jid).catch(() => "https://placehold.net/avatar.png");
            const result = ctx.api.createUrl("nexray", "/maker/qc", {
                text: input,
                name: isQuoted ? ctx.quoted?.pushName : ctx.sender.pushName,
                avatar: profilePictureUrl,
                color: "abu"
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
};
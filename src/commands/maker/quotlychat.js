const config = require("../../runtime/config");

module.exports = {
    name: "quotlychat",
    aliases: ["qc", "quotly"],
    category: "maker",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "get in the fucking robot, shinji!")
            );
        if (input.length > 1000) return await ctx.reply(ctx.format.info("Maks 1000 karakter."));

        try {
            const isQuoted = !ctx.text && ctx.quoted;
            const profilePictureUrl = await ctx.core.profilePictureUrl(isQuoted ? ctx.quoted?.sender.jid : ctx.sender.jid).catch(() => "https://placehold.net/avatar.png");
            const result = ctx.api.createUrl("delirius", "/canvas/quotly", {
                image: profilePictureUrl,
                username: isQuoted ? ctx.quoted?.pushName : ctx.sender.pushName,
                text: input,
                bg: Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
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
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
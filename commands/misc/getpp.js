module.exports = {
    name: "getpp",
    aliases: ["geticon"],
    category: "misc",
    code: async (ctx) => {
        const target = await ctx.target();
        if (!target.jid)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "@6281234567891")}\n` +
                    ctx.format.generateNotes([
                        "Balas/quote pesan untuk menjadikan pengirim sebagai akun target."
                    ]),
                mentions: ["6281234567891@s.whatsapp.net"]
            });
        try {
            const result = await ctx.core.profilePictureUrl(target.jid);
            await ctx.reply({
                image: {
                    url: result
                },
                caption: `❖ ${ctx.format.bold("Akun")}: @${ctx.getId(target.jid)}`,
                mentions: [target.jid]
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
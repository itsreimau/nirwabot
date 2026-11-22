module.exports = {
    name: "getpp",
    aliases: ["pp"],
    category: "misc",
    code: async (ctx) => {
        const target = await ctx.target();
        if (!target.id)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "@6281234567891")}\n` +
                    ctx.format.generateNotes([
                        "Balas/quote pesan target."
                    ]),
                mentions: ["6281234567891@s.whatsapp.net"]
            });

        const result = await ctx.core.profilePictureUrl(target.id);
        await ctx.reply({
            image: {
                url: result
            },
            caption: `❖ ${ctx.format.bold("Akun")}: @${ctx.getId(target.id)}`,
            mentions: [target.id]
        });
    }
};
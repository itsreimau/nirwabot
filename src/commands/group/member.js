module.exports = [{
    name: "add",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true,
        restrict: true
    },
    code: async (ctx) => {
        const target = await ctx.target(["text"]);
        if (!target.id)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "6281234567891")}`,
                mentions: ["6281234567891@s.whatsapp.net"]
            });
        const isOnWhatsApp = await ctx.core.onWhatsApp(target.id);
        if (!isOnWhatsApp?.[0]?.exists) return await ctx.reply(ctx.format.info("Akun tidak ada di WhatsApp."));

        try {
            await ctx.group().add(target.id);
            await ctx.reply(ctx.format.info("Ditambahkan."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}, {
    name: "kick",
    aliases: ["dor", "kik"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true,
        restrict: true
    },
    code: async (ctx) => {
        const target = await ctx.target(["quoted", "mentioned"]);
        if (!target.id)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "@6281234567891")}\n` +
                    ctx.format.generateNotes([
                        "Balas/quote pesan target."
                    ]),
                mentions: ["6281234567891@s.whatsapp.net"]
            });
        if (await ctx.group().isOwner(target.id)) return await ctx.reply(ctx.format.info("Dia owner grup."));

        try {
            await ctx.group().kick(target.id);
            await ctx.reply(ctx.format.info("Dikeluarkan."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}];
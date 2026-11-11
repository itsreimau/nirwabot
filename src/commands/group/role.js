const buildUsage = async (ctx) =>
    await ctx.reply({
        text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
            `${ctx.format.generateCmdExample(ctx.used, "@6281234567891")}\n` +
            ctx.format.generateNotes([
                "Balas/quote pesan target."
            ]),
        mentions: ["6281234567891@s.whatsapp.net"]
    });

module.exports = [{
    name: "promote",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const target = await ctx.target(["quoted", "mentioned"]);
        if (!target.id) return await buildUsage(ctx);
        if (await ctx.group().isOwner(target.id)) return await ctx.reply(ctx.format.info("Dia owner grup."));

        try {
            await ctx.group().promote(target.id);
            await ctx.reply(ctx.format.info("Jadi admin."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}, {
    name: "demote",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const target = await ctx.target(["quoted", "mentioned"]);
        if (!target.id) return await buildUsage(ctx);
        if (await ctx.group().isOwner(target.id)) return await ctx.reply(ctx.format.info("Dia anggota."));

        try {
            await ctx.group().demote(target.id);
            await ctx.reply(ctx.format.info("Jadi anggota."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}];
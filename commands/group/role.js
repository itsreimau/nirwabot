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
        if (!target.jid)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "@6281234567891")}\n` +
                    ctx.format.generateNotes([
                        "Balas/quote pesan untuk menjadikan pengirim sebagai akun target."
                    ]),
                mentions: ["6281234567891@s.whatsapp.net"]
            });
        if (await ctx.group().isOwner(target.jid)) return await ctx.reply(ctx.format.info("Dia adalah owner grup!"));
        try {
            await ctx.group().promote(target.jid);
            await ctx.reply(ctx.format.info("Berhasil ditingkatkan dari anggota menjadi admin!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
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
        if (!target.jid)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "@6281234567891")}\n` +
                    ctx.format.generateNotes([
                        "Balas/quote pesan untuk menjadikan pengirim sebagai akun target."
                    ]),
                mentions: ["6281234567891@s.whatsapp.net"]
            });
        if (!await ctx.group().isAdmin(target.jid)) return await ctx.reply(ctx.format.info("Dia adalah anggota!"));
        try {
            await ctx.group().demote(target.jid);
            await ctx.reply(ctx.format.info("Berhasil diturunkan dari admin menjadi anggota!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}];
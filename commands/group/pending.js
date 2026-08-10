module.exports = [{
    name: "approve",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        if (ctx.args[0]?.toLowerCase() === "all") {
            const pendings = await ctx.group().pendingMembers();
            if (pendings.length === 0) return await ctx.reply(ctx.format.info("Tidak ada anggota yang menunggu persetujuan."));
            try {
                const allJids = pendings.map(pending => pending.jid);
                await ctx.group().approvePendingMembers(allJids);
                return await ctx.reply(ctx.format.info(`Berhasil menyetujui semua anggota (${allJids.length}).`));
            } catch (error) {
                return await ctx.helper.handleError(ctx, error);
            }
        }

        const target = await ctx.target(["text"]);
        if (!target.jid)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "6281234567891")}\n` +
                ctx.format.generateNotes([
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} all`)} untuk menyetujui semua anggota yang tertunda.`
                ])
            );

        const pendings = await ctx.group().pendingMembers();
        const isPending = pendings.some(pending => ctx.helper.areJidsSameUser(pending.jid, target.jid));
        if (!isPending) return await ctx.reply(ctx.format.info("Akun tidak ditemukan di daftar anggota yang menunggu persetujuan."));
        try {
            await ctx.group().approvePendingMembers(target.jid);
            await ctx.reply(ctx.format.info("Berhasil disetujui!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}, {
    name: "reject",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        if (ctx.args[0]?.toLowerCase() === "all") {
            const pendings = await ctx.group().pendingMembers();
            if (pendings.length === 0) return await ctx.reply(ctx.format.info("Tidak ada anggota yang menunggu persetujuan."));
            try {
                const allJids = pendings.map(pending => pending.jid);
                await ctx.group().rejectPendingMembers(allJids);
                return await ctx.reply(ctx.format.info(`Berhasil menolak semua anggota (${allJids.length}).`));
            } catch (error) {
                return await ctx.helper.handleError(ctx, error);
            }
        }

        const target = await ctx.target(["text"]);
        if (!target.jid)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "6281234567891")}\n` +
                ctx.format.generateNotes([
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} all`)} untuk menolak semua anggota yang tertunda.`
                ])
            );

        const pendings = await ctx.group().pendingMembers();
        const isPending = pendings.some(pending => ctx.helper.areJidsSameUser(pending.jid, target.jid));
        if (!isPending) return await ctx.reply(ctx.format.info("Akun tidak ditemukan di daftar anggota yang menunggu persetujuan."));
        try {
            await ctx.group().rejectPendingMembers(target.jid);
            await ctx.reply(ctx.format.info("Berhasil ditolak!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}];
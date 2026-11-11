const buildUsage = async (ctx, action) =>
    await ctx.reply(
        `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
        `${ctx.format.generateCmdExample(ctx.used, "6281234567891")}\n` +
        ctx.format.generateNotes([
            `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} all`)} untuk ${action} semua`
        ])
    );

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
            if (!pendings.length) return await ctx.reply(ctx.format.info("Tidak ada pending."));
            try {
                const allJids = pendings.map(p => p.lid);
                await ctx.group().approvePendingMembers(allJids);
                return await ctx.reply(ctx.format.info(`Disetujui semua (${allJids.length}).`));
            } catch (error) {
                return await ctx.helper.reportError(ctx, error);
            }
        }
        const target = await ctx.target(["text"]);
        if (!target.id) return await buildUsage(ctx, "menyetujui");
        const pendings = await ctx.group().pendingMembers();
        if (!pendings.some(pending => ctx.helper.areJidsSameUser(pending.lid, target.id))) return await ctx.reply(ctx.format.info("Tidak ada di daftar pending."));

        try {
            await ctx.group().approvePendingMembers(target.id);
            await ctx.reply(ctx.format.info("Disetujui."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
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
            if (!pendings.length) return await ctx.reply(ctx.format.info("Tidak ada pending."));
            try {
                const allJids = pendings.map(pending => pending.lid);
                await ctx.group().rejectPendingMembers(allJids);
                return await ctx.reply(ctx.format.info(`Ditolak semua (${allJids.length}).`));
            } catch (error) {
                return await ctx.helper.reportError(ctx, error);
            }
        }
        const target = await ctx.target(["text"]);
        if (!target.id) return await buildUsage(ctx, "menolak");
        const pendings = await ctx.group().pendingMembers();
        if (!pendings.some(pending => ctx.helper.areJidsSameUser(pending.lid, target.id))) return await ctx.reply(ctx.format.info("Tidak ada di daftar pending."));

        try {
            await ctx.group().rejectPendingMembers(target.id);
            await ctx.reply(ctx.format.info("Ditolak."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}];
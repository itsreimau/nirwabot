const buildUsage = async (ctx) =>
    await ctx.reply({
        text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
            `${ctx.format.generateCmdExample(ctx.used, "@6281234567891 -s")}\n` +
            `${ctx.format.generateNotes([
                "Balas/quote pesan target."
            ])}\n` +
            ctx.format.generatesFlagInfo({
                "-s": "Diam, tanpa notifikasi"
            }),
        mentions: ["6281234567891@s.whatsapp.net"]
    });

module.exports = [{
    name: "banuser",
    aliases: ["ban", "bu"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const target = await ctx.target();
        if (!target.id) return await buildUsage(ctx);
        try {
            const targetDb = ctx.getDb("users", target.id);
            targetDb.banned = true;
            targetDb.save();
            const flag = ctx.flag({
                silent: {
                    type: "boolean",
                    short: "s",
                    default: false
                }
            });
            if (!flag.silent && !config.system.restrict) await ctx.sendMessage(target.id, ctx.format.info("Anda dibanned owner."));
            await ctx.reply(ctx.format.info("Berhasil banned."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}, {
    name: "unbanuser",
    aliases: ["ubu", "unban"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const target = await ctx.target();
        if (!target.id) return await buildUsage(ctx);
        try {
            const targetDb = ctx.getDb("users", target.id);
            targetDb.banned = false;
            targetDb.save();
            const flag = ctx.flag({
                silent: {
                    type: "boolean",
                    short: "s",
                    default: false
                }
            });
            if (!flag.silent && !config.system.restrict) await ctx.sendMessage(target.id, ctx.format.info("Anda diunbanned owner."));
            await ctx.reply(ctx.format.info("Berhasil unban."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}];
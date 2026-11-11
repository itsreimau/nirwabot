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
    name: "warning",
    aliases: ["warn"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true,
        restrict: true
    },
    code: async (ctx) => {
        const target = await ctx.target(["quoted", "mentioned"]);
        if (!target.id) return await buildUsage(ctx);
        if (ctx.helper.areJidsSameUser(target.id, ctx.me.lid)) return await ctx.reply(ctx.format.info("Tidak bisa warning bot."));
        if (await ctx.group().isOwner(target.id)) return await ctx.reply(ctx.format.info("Tidak bisa warning owner."));

        try {
            const groupDb = ctx.db.group;
            const warnings = groupDb.warnings;
            const maxWarnings = groupDb.maxwarnings;
            const idx = warnings.findIndex(warning => ctx.helper.areJidsSameUser(warning.id, target.id));
            let newCount;
            if (idx !== -1) {
                warnings[idx].count += 1;
                newCount = warnings[idx].count;
            } else {
                newCount = 1;
                warnings.push({
                    id: target.id,
                    count: newCount
                });
            }
            groupDb.warnings = warnings;
            groupDb.save();
            if (newCount >= maxWarnings) {
                await ctx.reply(ctx.format.info(`Mencapai batas warning (${newCount}/${maxWarnings}). Dikeluarkan.`));
                await ctx.group().kick(target);
                groupDb.warnings = warnings.filter(warning => warning.id !== target);
            } else {
                await ctx.reply(ctx.format.info(`Warning ${newCount}/${maxWarnings}.`));
            }
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}, {
    name: "unwarning",
    aliases: ["unwarn"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true,
        restrict: true
    },
    code: async (ctx) => {
        const target = await ctx.target(["quoted", "mentioned"]);
        if (!target.id) return await buildUsage(ctx);
        if (ctx.helper.areJidsSameUser(target.id, ctx.me.lid)) return await ctx.reply(ctx.format.info("Tidak bisa warning bot."));
        if (await ctx.group().isOwner(target.id)) return await ctx.reply(ctx.format.info("Tidak bisa warning owner."));

        try {
            const groupDb = ctx.db.group;
            const warnings = groupDb.warnings;
            const maxWarnings = groupDb.maxwarnings;
            const idx = warnings.findIndex(warning => ctx.helper.areJidsSameUser(warning.id, target.id));
            if (idx === -1) return await ctx.reply(ctx.format.info("Tidak memiliki warning."));
            const currentCount = warnings[idx].count || 0;
            if (currentCount <= 0) {
                warnings.splice(idx, 1);
                groupDb.warnings = warnings;
                groupDb.save();
                return await ctx.reply(ctx.format.info("Tidak memiliki warning."));
            }
            const newCount = currentCount - 1;
            if (newCount <= 0) warnings.splice(idx, 1);
            else warnings[idx].count = newCount;
            groupDb.warnings = warnings;
            groupDb.save();
            await ctx.reply(ctx.format.info(`Warning ${newCount}/${maxWarnings}.`));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}];
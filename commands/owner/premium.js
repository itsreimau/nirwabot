module.exports = [{
    name: "addpremiumuser",
    aliases: ["addpremuser", "addprem", "apu"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const target = await ctx.target();
        const daysAmount = Number(ctx.args[target.source === "quoted" ? 0 : 1]);
        if (!target.id)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "@6281234567891 8 -s")}\n` +
                    `${ctx.format.generateNotes([
                        "Balas/quote pesan target."
                    ])}\n` +
                    ctx.format.generatesFlagInfo({
                        "-s": "Diam, tanpa notifikasi"
                    }),
                mentions: ["6281234567891@s.whatsapp.net"]
            });
        if (daysAmount && daysAmount <= 0) return await ctx.reply(ctx.format.info("Durasi premium harus > 0 hari."));

        try {
            const flag = ctx.flag({
                silent: {
                    type: "boolean",
                    short: "s",
                    default: false
                }
            });
            const targetDb = ctx.getDb("users", target.id);
            targetDb.premium = true;
            if (daysAmount && daysAmount > 0) {
                targetDb.premiumExpiration = Date.now() + (daysAmount * 24 * 60 * 60 * 1000);
                targetDb.save();
                if (!flag.silent && !config.system.restrict) await ctx.sendMessage(target.id, ctx.format.info(`Anda premium ${daysAmount} hari dari owner.`));
                await ctx.reply(ctx.format.info(`Premium ${daysAmount} hari ditambahkan.`));
            } else {
                targetDb.premiumExpiration = null;
                targetDb.save();
                if (!flag.silent && !config.system.restrict) await ctx.sendMessage(target.id, ctx.format.info("Anda premium selamanya dari owner."));
                await ctx.reply(ctx.format.info("Premium selamanya ditambahkan."));
            }
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}, {
    name: "delpremiumuser",
    aliases: ["delpremuser", "delprem", "dpu"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const target = await ctx.target();
        if (!target.id)
            return await ctx.reply({
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

        try {
            const targetDb = ctx.getDb("users", target.id);
            targetDb.premium = false;
            targetDb.premiumExpiration = null;
            targetDb.save();
            const flag = ctx.flag({
                silent: {
                    type: "boolean",
                    short: "s",
                    default: false
                }
            });
            if (!flag.silent && !config.system.restrict) await ctx.sendMessage(target.id, ctx.format.info("Premium Anda dicabut owner."));
            await ctx.reply(ctx.format.info("Premium dicabut."));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}];
module.exports = [{
    name: "addsewagroup",
    aliases: ["addsewa", "addsewagrup", "adg"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const target = ctx.isGroup() ? {
            id: ctx.id
        } : await ctx.target(["text_group"]);
        const daysAmount = Number(ctx.args[target.source === "text_group" ? 1 : 0]);
        if (!target.id || !daysAmount)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "1234567890 8 -s")}\n` +
                `${ctx.format.generateNotes([
                    "Gunakan di grup untuk otomatis menyewakan grup ini."
                ])}\n` +
                ctx.format.generatesFlagInfo({
                    "-s": "Diam, tanpa notifikasi ke owner grup"
                })
            );
        if (!await ctx.group(target.id)) return await ctx.reply(ctx.format.info("Grup tidak valid / bot tidak ada di sana."));

        try {
            const flag = ctx.flag({
                silent: {
                    type: "boolean",
                    short: "s",
                    default: false
                }
            });
            const group = await ctx.group(target.id);
            const groupOwner = await group.owner();
            let groupMentions;
            if (!flag.silent && groupOwner && !config.system.restrict) {
                groupMentions = [{
                    groupJid: `${group.id}@g.us`,
                    groupSubject: await group.name()
                }];
            }
            const targetDb = ctx.getDb("groups", target.id);
            targetDb.sewa = true;
            if (daysAmount && daysAmount > 0) {
                targetDb.sewaExpiration = Date.now() + (daysAmount * 24 * 60 * 60 * 1000);
                targetDb.save();
                if (!flag.silent && groupOwner && !config.system.restrict)
                    await ctx.sendMessage(groupOwner, {
                        text: ctx.format.info(`Bot disewakan ke grup @${groupMentions.groupJid} ${daysAmount} hari.`),
                        contextInfo: {
                            groupMentions
                        }
                    });
                await ctx.reply(ctx.format.info(`Sewa ${daysAmount} hari berhasil.`));
            } else {
                targetDb.sewaExpiration = null;
                targetDb.save();
                if (!flag.silent && groupOwner && !config.system.restrict)
                    await ctx.sendMessage(groupOwner, {
                        text: ctx.format.info(`Bot disewakan ke grup @${groupMentions.groupJid} selamanya.`),
                        contextInfo: {
                            groupMentions
                        }
                    });
                await ctx.reply(ctx.format.info("Sewa selamanya berhasil."));
            }
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}, {
    name: "delsewagroup",
    aliases: ["delsewa", "delsewagrup", "dsg"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const target = ctx.isGroup() ? {
            id: ctx.id
        } : await ctx.target(["text_group"]);
        if (!target.id)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "1234567890 -s")}\n` +
                `${ctx.format.generateNotes([
                    "Gunakan di grup untuk otomatis menghapus sewa grup ini."
                ])}\n` +
                ctx.format.generatesFlagInfo({
                    "-s": "Diam, tanpa notifikasi ke owner grup"
                })
            );
        if (!await ctx.group(target.id)) return await ctx.reply(ctx.format.info("Grup tidak valid / bot tidak ada di sana."));

        try {
            const targetDb = ctx.getDb("groups", target.id);
            targetDb.sewa = false;
            targetDb.sewaExpiration = null;
            targetDb.save();
            const flag = ctx.flag({
                silent: {
                    type: "boolean",
                    short: "s",
                    default: false
                }
            });
            const group = await ctx.group(target.id);
            const groupOwner = await group.owner();
            if (!flag.silent && groupOwner && !config.system.restrict) {
                const groupMentions = [{
                    groupJid: `${group.id}@g.us`,
                    groupSubject: await group.name()
                }];
                await ctx.sendMessage(groupOwner, {
                    text: ctx.format.info(`Sewa bot grup @${groupMentions.groupJid} dihentikan owner.`),
                    contextInfo: {
                        groupMentions
                    }
                });
            }
            await ctx.reply(ctx.format.info("Sewa grup dihapus."));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}];
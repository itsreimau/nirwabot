module.exports = [{
    name: "addsewagroup",
    aliases: ["addsewa", "addsewagrup", "adg"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const target = ctx.isGroup() ? {
            jid: ctx.id
        } : await ctx.target(["text_group"]);
        const daysAmount = parseInt(ctx.args[target.source === "text_group" ? 1 : 0]);
        if (!target.jid || !daysAmount)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "1234567890 8 -s")}\n` +
                `${ctx.format.generateNotes([
                    "Gunakan di grup untuk otomatis menyewakan grup tersebut."
                ])}\n` +
                ctx.format.generatesFlagInfo({
                    "-s": "Tetap diam dengan tidak menyiarkan ke owner grup"
                })
            );

        if (!await ctx.group(target.jid)) return await ctx.reply(ctx.format.info("Grup tidak valid atau bot tidak ada di grup tersebut!"));

        try {
            const flag = ctx.flag({
                silent: {
                    type: "boolean",
                    short: "s",
                    default: false
                }
            });
            const group = await ctx.group(target.jid);
            const groupOwner = await group.owner();
            let groupMentions;
            if (!flag.silent && groupOwner && !config.system.restrict) {
                groupMentions = [{
                    groupJid: `${group.id}@g.us`,
                    groupSubject: await group.name()
                }];
            }

            const targetDb = ctx.getDb("groups", target.jid);
            if (daysAmount && daysAmount > 0) {
                targetDb.sewaExpiration = Date.now() + (daysAmount * 24 * 60 * 60 * 1000);
                targetDb.save();
                if (!flag.silent && groupOwner && !config.system.restrict)
                    await ctx.sendMessage(groupOwner, {
                        text: ctx.format.info(`Bot berhasil disewakan ke grup @${groupMentions.groupJid} selama ${daysAmount} hari!`),
                        contextInfo: {
                            groupMentions
                        }
                    });
                await ctx.reply(ctx.format.info(`Berhasil menyewakan bot ke grup ${ctx.isGroup() ? "ini" : "itu"} selama ${daysAmount} hari!`));
            } else {
                targetDb.sewaExpiration = null;
                targetDb.save();
                if (!flag.silent && groupOwner && !config.system.restrict)
                    await ctx.sendMessage(groupOwner, {
                        text: ctx.format.info(`Bot berhasil disewakan ke grup @${groupMentions.groupJid} selamanya!`),
                        contextInfo: {
                            groupMentions
                        }
                    });
                await ctx.reply(ctx.format.info(`Berhasil menyewakan bot ke grup ${ctx.isGroup() ? "ini" : "itu"} selamanya!`));
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
            jid: ctx.id
        } : await ctx.target(["text_group"]);
        if (!target.jid)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "1234567890 -s")}\n` +
                `${ctx.format.generateNotes([
                    "Gunakan di grup untuk otomatis menghapus sewa grup tersebut."
                ])}\n` +
                ctx.format.generatesFlagInfo({
                    "-s": "Tetap diam dengan tidak menyiarkan ke owner grup"
                })
            );

        if (!await ctx.group(target.jid)) return await ctx.reply(ctx.format.info("Grup tidak valid atau bot tidak ada di grup tersebut!"));

        try {
            const targetDb = ctx.getDb("groups", target.jid);
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
            const group = await ctx.group(target.jid);
            const groupOwner = await group.owner();
            if (!flag.silent && groupOwner && !config.system.restrict) {
                const groupMentions = [{
                    groupJid: `${group.id}@g.us`,
                    groupSubject: await group.name()
                }];
                await ctx.sendMessage(groupOwner, {
                    text: ctx.format.info(`Sewa bot untuk grup @${groupMentions.groupJid} telah dihentikan oleh owner!`),
                    contextInfo: {
                        groupMentions
                    }
                });
            }
            await ctx.reply(ctx.format.info(`Berhasil menghapus sewa bot untuk grup ${ctx.isGroup() ? "ini" : "itu"}!`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}];
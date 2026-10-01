const filterGroups = async (ctx, blacklist) => Object.values(await ctx.core.groupFetchAllParticipating()).filter(group => !blacklist.includes(group.id) && !group.announce && !group.isCommunity && !group.isCommunityAnnounce).map(group => group.id);

const handleBlacklist = async (ctx, botDb, blacklist) => {
    const index = blacklist.indexOf(ctx.id);
    if (index > -1) blacklist.splice(index, 1);
    else blacklist.push(ctx.id);
    botDb.blacklistBroadcast = blacklist;
    botDb.save();
    return await ctx.reply(ctx.format.info(index > -1 ? "Grup dihapus dari blacklist." : "Grup ditambahkan ke blacklist."));
};

module.exports = [{
    name: "broadcastgc",
    aliases: ["bc", "bcht", "bcgc", "broadcast"],
    category: "owner",
    permissions: {
        owner: true,
        restrict: true
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "halo, dunia!")}\n` +
                ctx.format.generateNotes([
                    `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} blacklist`)} untuk memasukkan grup ke blacklist (Hanya berfungsi pada grup)`
                ])
            );
        const botDb = ctx.db.bot;
        const blacklist = botDb.blacklistBroadcast;
        if (ctx.args[0]?.toLowerCase() === "blacklist" && ctx.isGroup()) return await handleBlacklist(ctx, botDb, blacklist);

        try {
            const groupJids = await filterGroups(ctx, blacklist);
            const {
                delays,
                duration
            } = ctx.helper.calculateDelays(groupJids.length);
            const waitMsg = await ctx.reply(ctx.format.info(`Mengirim ke ${groupJids.length} grup, estimasi ${ctx.format.convertMsToDuration(duration)}`));
            for (let i = 0; i < groupJids.length; i++) {
                try {
                    await ctx.sendMessage(groupJids[i], {
                        image: {
                            url: config.bot.thumbnail
                        },
                        caption: input,
                        mentionAll: ctx.used.command === "bcht",
                        footer: config.msg.footer,
                        buttons: [{
                            text: "Hubungi Owner",
                            id: `${ctx.used.prefix}owner`
                        }, {
                            text: "Donasi",
                            id: `${ctx.used.prefix}donate`
                        }]
                    });
                    await ctx.helper.delay(delays[i]);
                } catch {}
            }
            await ctx.edit(ctx.format.info(`Terkirim ke ${groupJids.length} grup.`), waitMsg.key);
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}, {
    name: "broadcastgcsw",
    aliases: ["bcgcsw", "bcswgc"],
    category: "owner",
    permissions: {
        owner: true,
        restrict: true
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        const type = ctx.isMedia(["image", "video"]);
        if (!input && !type)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "halo, dunia!")}\n` +
                ctx.format.generateNotes([
                    `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} blacklist`)} untuk memasukkan grup ke blacklist (Hanya berfungsi pada grup)`
                ])
            );
        const botDb = ctx.db.bot;
        const blacklist = botDb.blacklistBroadcast;
        if (ctx.args[0]?.toLowerCase() === "blacklist" && ctx.isGroup()) return await handleBlacklist(ctx, botDb, blacklist);

        try {
            const groupJids = await filterGroups(ctx, blacklist);
            const content = type ? {
                [type]: await ctx.msg.media.download() || await ctx.quoted.media.download(),
                caption: input
            } : {
                text: input
            };
            const {
                delays,
                duration
            } = ctx.helper.calculateDelays(groupJids.length);
            const waitMsg = await ctx.reply(ctx.format.info(`Mengirim ke ${groupJids.length} grup, estimasi ${ctx.format.convertMsToDuration(duration)}`));
            for (let i = 0; i < groupJids.length; i++) {
                try {
                    await ctx.sendMessage(groupJids[i], {
                        ...content,
                        statusAudience: {
                            listName: config.bot.name,
                            listEmoji: "🏷️"
                        },
                        groupStatus: true
                    });
                    await ctx.helper.delay(delays[i]);
                } catch {}
            }
            await ctx.edit(ctx.format.info(`Terkirim ke ${groupJids.length} grup.`), waitMsg.key);
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}];
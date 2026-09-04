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
                    `Gunakan ${ctx.format.inlineCode("blacklist")} untuk memasukkan grup ke dalam blacklist. (Hanya berfungsi pada grup)`
                ])
            );

        const botDb = ctx.db.bot;
        let blacklist = botDb.blacklistBroadcast || [];

        if (ctx.args[0]?.toLowerCase() === "blacklist" && ctx.isGroup()) {
            const groupIndex = blacklist.indexOf(ctx.id);
            if (groupIndex > -1) {
                blacklist.splice(groupIndex, 1);
                botDb.blacklistBroadcast = blacklist;
                botDb.save();
                return await ctx.reply(ctx.format.info("Grup ini telah dihapus dari blacklist broadcast"));
            } else {
                blacklist.push(ctx.id);
                botDb.blacklistBroadcast = blacklist;
                botDb.save();
                return await ctx.reply(ctx.format.info("Grup ini telah ditambahkan ke blacklist broadcast"));
            }
        }

        try {
            const groupJids = Object.values(await ctx.core.groupFetchAllParticipating()).filter(g => !blacklist.includes(g.id) && !g.announce && !g.isCommunity && !g.isCommunityAnnounce).map(g => g.id);
            const {
                delays,
                duration
            } = ctx.helper.calculateDelays(groupJids.length);
            const waitMsg = await ctx.reply(ctx.format.info(`Mengirim siaran ke ${groupJids.length} grup, perkiraan waktu: ${ctx.format.convertMsToDuration(duration)}`));
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
            await ctx.editMessage(ctx.id, waitMsg.key, ctx.format.info(`Berhasil mengirim ke ${groupJids.length} grup.`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
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
                    `Gunakan ${ctx.format.inlineCode("blacklist")} untuk memasukkan grup ke dalam blacklist. (Hanya berfungsi pada grup)`
                ])
            );

        const botDb = ctx.db.bot;
        let blacklist = botDb.blacklistBroadcast || [];

        if (ctx.args[0]?.toLowerCase() === "blacklist" && ctx.isGroup()) {
            const groupIndex = blacklist.indexOf(ctx.id);
            if (groupIndex > -1) {
                blacklist.splice(groupIndex, 1);
                botDb.blacklistBroadcast = blacklist;
                botDb.save();
                return await ctx.reply(ctx.format.info("Grup ini telah dihapus dari blacklist broadcast"));
            } else {
                blacklist.push(ctx.id);
                botDb.blacklistBroadcast = blacklist;
                botDb.save();
                return await ctx.reply(ctx.format.info("Grup ini telah ditambahkan ke blacklist broadcast"));
            }
        }

        try {
            const groupJids = Object.values(await ctx.core.groupFetchAllParticipating()).filter(g => !blacklist.includes(g.id) && !g.announce && !g.isCommunity && !g.isCommunityAnnounce).map(g => g.id);
            let content;
            if (type) {
                const buffer = await ctx.msg.media.download() || await ctx.quoted.media.download();
                content = {
                    [type]: buffer,
                    caption: input
                };
            } else {
                content = {
                    text: input
                };
            }
            const {
                delays,
                duration
            } = ctx.helper.calculateDelays(groupJids.length);
            const waitMsg = await ctx.reply(ctx.format.info(`Mengirim siaran ke ${groupJids.length} grup, perkiraan waktu: ${ctx.format.convertMsToDuration(duration)}`));
            for (let i = 0; i < groupJids.length; i++) {
                try {
                    await ctx.sendMessage(groupJids[i], {
                        ...content,
                        contextInfo: {
                            statusAudienceMetadata: {
                                audienceType: 1,
                                listName: config.bot.name,
                                listEmoji: "🏷️"
                            }
                        },
                        groupStatus: true
                    });
                    await ctx.helper.delay(delays[i]);
                } catch {}
            }
            await ctx.editMessage(ctx.id, waitMsg.key, ctx.format.info(`Berhasil mengirim ke ${groupJids.length} grup.`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}];
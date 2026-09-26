const util = require("node:util");
const moment = require("moment-timezone");

async function handleWarning(ctx, senderJid, senderId, groupJid, groupDb) {
    const maxWarnings = groupDb.maxwarnings;
    const warnings = groupDb.warnings;
    const senderWarning = warnings.find(warning => ctx.helper.areJidsSameUser(warning.id, senderJid));
    let currentWarnings = senderWarning ? senderWarning.count : 0;
    currentWarnings += 1;
    if (senderWarning) {
        senderWarning.count = currentWarnings;
    } else {
        warnings.push({
            id: senderJid,
            count: currentWarnings
        });
    }
    groupDb.warnings = warnings;
    await ctx.reply({
        text: ctx.format.info(`Warning ${currentWarnings}/${maxWarnings} untuk @${senderId}.`),
        mentions: [senderJid]
    });
    if (currentWarnings >= maxWarnings) {
        const isBotAdmin = await ctx.group(groupJid, !config.system.selfReply).isBotAdmin();
        if (isBotAdmin) {
            await ctx.reply(ctx.format.info(`Anda menerima ${maxWarnings} warning dan akan dikeluarkan.`));
            if (!config.system.restrict) await ctx.group().kick(senderJid);
            groupDb.warnings = warnings.filter(warning => warning.id !== senderJid);
        } else {
            await ctx.reply(ctx.format.info(`Tidak bisa mengeluarkan Anda (${maxWarnings} warning).`));
        }
    }
    groupDb.save();
}

async function handleAntiViolation(ctx, text, senderJid, senderId, groupJid, groupDb) {
    await ctx.reply(ctx.format.info(text));
    await ctx.delete(ctx.msg.key);
    if (groupDb.option?.autokick || !config.system.restrict) {
        await ctx.group().kick(senderJid);
    } else {
        await handleWarning(ctx, senderJid, senderId, groupJid, groupDb);
    }
}

module.exports = (bot) => {
    bot.ev.on("MessagesUpsert", async (ctx) => {
        const {
            msg
        } = ctx;
        if (msg.key.fromMe) return;

        const isGroup = ctx.isGroup();
        const isPrivate = ctx.isPrivate();
        if (!isGroup && !isPrivate) return;

        const senderJid = ctx.sender.jid;
        const senderId = ctx.getId(senderJid);
        const senderName = ctx.sender.pushName;
        const groupJid = isGroup ? ctx.id : null;
        const groupName = isGroup ? await ctx.group().name() : null;

        const isOwner = ctx.sender.isOwner();
        const isCmd = ctx.isCmd();
        const isAdmin = isGroup ? await ctx.group().isSenderAdmin() : false;

        const botDb = ctx.db.bot;
        const senderDb = ctx.db.user;
        const groupDb = ctx.db.group;
        if (!senderDb || !groupDb) return;

        if (senderDb.premium && senderDb.premiumExpiration && Date.now() >= senderDb.premiumExpiration) {
            senderDb.premium = false;
            senderDb.premiumExpiration = null;
            senderDb.save();
        }

        if (botDb.mode === "premium" && !isOwner && !senderDb.premium) return;
        if (botDb.mode === "group" && isPrivate && !isOwner && !senderDb.premium) return;
        if (botDb.mode === "private" && isGroup && !isOwner && !senderDb.premium) return;
        if (botDb.mode === "self" && !isOwner) return;

        const now = moment().tz(config.system.timeZone);
        if (config.system.unavailableAtNight && !isOwner && !senderDb.premium && now.hour() >= 0 && now.hour() < 6) return;

        if (isCmd?.prefix && botDb?.lastPrefix !== isCmd.prefix) {
            botDb.lastPrefix = isCmd.prefix;
            botDb.save();
        }

        if (isCmd?.didyoumean)
            await ctx.reply({
                text: ctx.format.info(`Apakah maksud Anda ${ctx.format.inlineCode(isCmd.prefix + isCmd.didyoumean)}?`),
                buttons: [{
                    text: "Ya, benar.",
                    id: `${isCmd.prefix + isCmd.didyoumean} ${isCmd.input}`
                }]
            });

        const autodownloadEnabled = senderDb.autodownload;
        if (autodownloadEnabled && !isCmd) {
            const urlPatterns = {
                facebook: /(facebook\.com|fb\.watch|fb\.com)/i,
                instagram: /(instagram\.com|instagr\.am)/i,
                tiktok: /(tiktok\.com|vt\.tiktok)/i,
                youtube: /(youtube\.com|youtu\.be)/i
            };
            const platformCommands = {
                facebook: "facebookdl",
                instagram: "instagramdl",
                tiktok: "tiktokdl",
                youtube: "youtubevideo"
            };
            const url = ctx.helper.extractUrlFromText(msg?.body);
            if (url) {
                let matchedCommand = null;
                let platform = null;
                for (const [key, pattern] of Object.entries(urlPatterns)) {
                    if (pattern.test(url)) {
                        platform = key;
                        matchedCommand = platformCommands[key];
                        break;
                    }
                }
                if (matchedCommand) {
                    await ctx.reply(ctx.format.info(`Download dari ${platform}...`));
                    await bot.forceCommand(ctx.id, matchedCommand, url, ctx.sender);
                }
            }
        }

        const senderAfk = senderDb.afk;
        if (msg.body && (senderAfk?.reason || senderAfk?.timestamp)) {
            const timeago = ctx.format.convertMsToDuration(Date.now() - senderAfk.timestamp);
            await ctx.reply(ctx.format.info(`Anda kembali setelah AFK${senderAfk.reason ? ` (${ctx.format.inlineCode(senderAfk.reason)})` : ""} selama ${timeago}.`));
            senderDb.afk = {};
            senderDb.save();
        }

        if (isGroup) {
            if (!isCmd || isCmd?.didyoumean) console.log(util.styleText("magenta", "[~]"), `Incoming message from group: ${groupName} (${groupJid}), by: ${senderName} (${senderJid})`);

            if (groupDb.sewa && Date.now() >= groupDb.sewaExpiration) {
                groupDb.sewa = false;
                groupDb.sewaExpiration = null;
                groupDb.save();
            }

            if (groupDb.mutebot) return;
            const muteList = groupDb.mute;
            groupDb.mute = muteList.filter(mute => !mute.expiration || Date.now() >= mute.expiration);
            if (groupDb.mute.length !== muteList.length) groupDb.save();
            if (groupDb.mute.some(mute => mute.id === senderJid)) await ctx.delete(msg.key);

            const currentMonth = now.format("YYYY-MM");
            if (groupDb.lastTopResetMonth && groupDb.lastTopResetMonth !== currentMonth) {
                groupDb.members = groupDb.members.map(m => ({
                    ...m,
                    sent: 0
                }));
                groupDb.lastTopResetMonth = currentMonth;
                groupDb.save();
            } else if (!groupDb.lastTopResetMonth) {
                groupDb.lastTopResetMonth = currentMonth;
                groupDb.save();
            }

            if (!isCmd && !isOwner && !isAdmin) {
                const antiActions = [{
                    type: "antiaudio",
                    media: "audio"
                }, {
                    type: "antidocument",
                    media: "document"
                }, {
                    type: "antiimage",
                    media: "image"
                }, {
                    type: "antisticker",
                    media: "sticker"
                }, {
                    type: "antivideo",
                    media: "video"
                }];
                for (const {
                        type,
                        media
                    }
                    of antiActions) {
                    if (groupDb.option?.[type] && ctx.isMedia([media], ["primary"])) await handleAntiViolation(ctx, `Jangan kirim ${media}.`, senderJid, senderId, groupJid, groupDb);
                }

                if (groupDb.option?.antigcsw && msg.message?.groupStatusMessageV2?.contextInfo?.isGroupStatus) await handleAntiViolation(ctx, "Jangan kirim SW grup, fomo lu?", senderJid, senderId, groupJid, groupDb);
                if (groupDb.option?.antilink && msg.body && ctx.helper.isUrl(msg.body)) await handleAntiViolation(ctx, "Jangan kirim link.", senderJid, senderId, groupJid, groupDb);
                if (groupDb.option?.antispam) {
                    const now = Date.now();
                    const spamData = groupDb.spam;
                    const senderSpam = spamData.find(spam => ctx.helper.areJidsSameUser(spam.id, senderJid)) || {
                        id: senderJid,
                        count: 0,
                        lastMessageTime: 0
                    };
                    const timeDiff = now - senderSpam.lastMessageTime;
                    const newCount = timeDiff < 5000 ? senderSpam.count + 1 : 1;
                    senderSpam.count = newCount;
                    senderSpam.lastMessageTime = now;
                    if (!spamData.some(spam => ctx.helper.areJidsSameUser(spam.id, senderJid))) spamData.push(senderSpam);
                    groupDb.spam = spamData;
                    if (newCount > 5) {
                        await handleAntiViolation(ctx, "Jangan spam, ngelag woy!", senderJid, senderId, groupJid, groupDb);
                        groupDb.spam = spamData.filter(spam => spam.id !== senderJid);
                    }
                    groupDb.save();
                }
                if (groupDb.option?.antitagsw && msg.message?.protocolMessage?.type === 25) await handleAntiViolation(ctx, "Jangan tag SW, gak ada yg peduli!", senderJid, senderId, groupJid, groupDb);
                if (groupDb.option?.antitoxic && msg.body && /(anj(k|g)|ajn?|a?njin|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?k|pe?pe?k|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|asshole|dontol|kontoi|ontol)/i.test(msg.body)) await handleAntiViolation(ctx, "Jangan toxic, dasar SDM rendah!", senderJid, senderId, groupJid, groupDb);
            }

            const afkMentions = ctx.quoted ? [ctx.quoted.sender.jid] : await ctx.getMentioned();
            if (afkMentions.length) {
                for (const mention of afkMentions) {
                    const mentionAfk = ctx.getDb("users", mention)?.afk || {};
                    if (mentionAfk.reason || mentionAfk.timestamp) {
                        const timeago = ctx.format.convertMsToDuration(Date.now() - mentionAfk.timestamp);
                        await ctx.reply({
                            text: ctx.format.info(`Jangan ganggu! @${ctx.getId(mention)} sedang AFK ${mentionAfk.reason ? `(${ctx.format.inlineCode(mentionAfk.reason)})` : ""} selama ${timeago}.`),
                            mentions: [mention]
                        });
                    }
                }
            }
        }

        if (isPrivate && (!isCmd || isCmd?.didyoumean)) console.log(util.styleText("magenta", "[~]"), `Incoming message from: ${senderName} (${senderJid})`);
    });
};
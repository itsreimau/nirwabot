const util = require("node:util");
const moment = require("moment-timezone");

async function handleWarning(ctx, senderLid, senderLidId, groupJid, groupDb) {
    const maxWarnings = groupDb.maxwarnings || 3;
    const warnings = groupDb.warnings || [];
    const senderWarning = warnings.find(warning => ctx.helper.areJidsSameUser(warning.id, senderLid));
    let currentWarnings = senderWarning ? senderWarning.count : 0;
    currentWarnings += 1;

    if (senderWarning) {
        senderWarning.count = currentWarnings;
    } else {
        warnings.push({
            id: senderLid,
            count: currentWarnings
        });
    }
    groupDb.warnings = warnings;

    await ctx.reply({
        text: ctx.format.info(`Warning ${currentWarnings}/${maxWarnings} untuk @${senderLidId}!`),
        mentions: [senderLid]
    });

    if (currentWarnings >= maxWarnings) {
        const isBotAdmin = await ctx.group(groupJid, !config.system.selfReply).isBotAdmin();
        if (isBotAdmin) {
            await ctx.reply(ctx.format.info(`Anda telah menerima ${maxWarnings} warning dan akan dikeluarkan dari grup!`));
            if (!config.system.restrict) await ctx.group().kick(senderLid);
            groupDb.warnings = warnings.filter(warning => warning.id !== senderLid);
        } else {
            await ctx.reply(ctx.format.info(`Tidak dapat mengeluarkan Anda yang telah mencapai ${maxWarnings} warning.`));
        }
    }
    groupDb.save();
}

async function handleAntiViolation(ctx, type, text, senderLid, senderLidId, groupJid, groupDb) {
    await ctx.reply(ctx.format.info(text));
    await ctx.delete(ctx.msg.key);
    if (groupDb.option?.autokick) {
        await ctx.group().kick(senderLid);
    } else {
        await handleWarning(ctx, senderLid, senderLidId, groupJid, groupDb);
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
        const senderLid = ctx.sender.lid;
        const senderLidId = ctx.getId(senderLid);
        const groupJid = isGroup ? ctx.id : null;
        const groupId = isGroup ? ctx.getId(groupJid) : null;
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
            senderDb.coin = 100;
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
                    text: "Ya, benar!",
                    id: `${isCmd.prefix + isCmd.didyoumean} ${isCmd.input}`
                }]
            });

        const autodownloadEnabled = senderDb.autodownload || false;
        if (autodownloadEnabled && !isCmd) {
            const urlPatterns = {
                facebook: /(facebook\.com|fb\.watch|fb\.com)/i,
                instagram: /(instagram\.com|instagr\.am)/i,
                tiktok: /(tiktok\.com|vt\.tiktok)/i,
                twitter: /(twitter\.com|x\.com)/i,
                youtube: /(youtube\.com|youtu\.be)/i
            };
            const platformCommands = {
                facebook: "facebookdl",
                instagram: "instagramdl",
                tiktok: "tiktokdl",
                twitter: "twitterdl",
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

        const senderAfk = senderDb.afk || {};
        if (msg.body && (senderAfk?.reason || senderAfk?.timestamp)) {
            const timeElapsed = Date.now() - senderAfk.timestamp;
            if (timeElapsed > 3000) {
                const hours = Math.floor(timeElapsed / (1000 * 60 * 60));
                const coins = hours * 5;
                if (coins > 0) {
                    senderDb.coin += coins;
                    senderDb.save();
                }
                const timeago = ctx.format.convertMsToDuration(timeElapsed);
                const rewardMsg = coins > 0 ? `+${coins} koin` : "";
                await ctx.reply(ctx.format.info(`Anda telah kembali setelah AFK ${senderAfk.reason ? `dengan alasan ${ctx.format.inlineCode(senderAfk.reason)}` : "tanpa alasan"} selama ${timeago}. ${rewardMsg}`.trim()));
                senderDb.afk = {};
                senderDb.save();
            }
        }

        if (isGroup) {
            if (!isCmd || isCmd?.didyoumean) console.log(util.styleText("magenta", "[~]"), `Incoming message from group: ${groupId}, by: ${senderId}`);

            if (groupDb.sewa && Date.now() >= groupDb.sewaExpiration) {
                groupDb.sewa = false;
                groupDb.sewaExpiration = null;
                groupDb.save();
            }

            if (groupDb.mutebot) return;
            const muteList = groupDb.mute || [];
            groupDb.mute = muteList.filter(mute => !mute.expiration || Date.now() >= mute.expiration);
            if (groupDb.mute.length !== muteList.length) groupDb.save();
            if (groupDb.mute.some(mute => mute.id === senderLid)) await ctx.delete(msg.key);

            let members = groupDb.members || [];
            const existing = members.find(m => ctx.helper.areJidsSameUser(m.id, senderLid));
            if (existing) {
                existing.sent = (existing.sent || 0) + 1;
                if (ctx.sender.pushName) existing.pushName = ctx.sender.pushName;
            } else {
                members.push({
                    id: senderLid,
                    sent: 1,
                    pushName: ctx.sender.pushName
                });
            }
            groupDb.members = members;
            groupDb.save();

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
                    if (groupDb.option?.[type] && ctx.isMedia([media], ["primary"])) await handleAntiViolation(ctx, type, `Jangan kirim ${media}!`, senderLid, senderLidId, groupJid, groupDb);
                }

                if (groupDb.option?.antigcsw && msg.message?.groupStatusMessageV2?.contextInfo?.isGroupStatus) await handleAntiViolation(ctx, "antigcsw", "Jangan kirim SW!", senderLid, senderLidId, groupJid, groupDb);
                if (groupDb.option?.antilink && msg.body && ctx.helper.isUrl(msg.body)) await handleAntiViolation(ctx, "antilink", "Jangan kirim link!", senderLid, senderLidId, groupJid, groupDb);
                if (groupDb.option?.antispam) {
                    const now = Date.now();
                    const spamData = groupDb.spam || [];
                    const senderSpam = spamData.find(spam => ctx.helper.areJidsSameUser(spam.id, senderLid)) || {
                        id: senderLid,
                        count: 0,
                        lastMessageTime: 0
                    };
                    const timeDiff = now - senderSpam.lastMessageTime;
                    const newCount = timeDiff < 5000 ? senderSpam.count + 1 : 1;
                    senderSpam.count = newCount;
                    senderSpam.lastMessageTime = now;
                    if (!spamData.some(spam => ctx.helper.areJidsSameUser(spam.id, senderLid))) spamData.push(senderSpam);
                    groupDb.spam = spamData;

                    if (newCount > 5) {
                        await handleAntiViolation(ctx, "antilink", "Jangan spam, ngelag woy!");
                        groupDb.spam = spamData.filter(spam => spam.id !== senderLid);
                    }
                    groupDb.save();
                }
                if (groupDb.option?.antitagsw && msg.message?.protocolMessage?.type === 25) await handleAntiViolation(ctx, "antitagsw", "Jangan kirim tag SW!", senderLid, senderLidId, groupJid, groupDb);
                if (groupDb.option?.antitoxic && msg.body && /(anj(k|g)|ajn?|a?njin|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?k|pe?pe?k|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|asshole|dontol|kontoi|ontol)/i.test(msg.body)) await handleAntiViolation(ctx, "antitoxic", "Jangan kirim toxic!", senderLid, senderLidId, groupJid, groupDb);
            }

            const afkMentions = ctx.quoted ? [ctx.quoted.sender] : await ctx.getMentioned();
            if (afkMentions.length) {
                for (const mention of afkMentions) {
                    const mentionAfk = ctx.getDb("users", mention)?.afk || {};
                    if (mentionAfk.reason || mentionAfk.timestamp) {
                        const timeago = ctx.format.convertMsToDuration(Date.now() - mentionAfk.timestamp);
                        await ctx.reply({
                            text: ctx.format.info(`Jangan ganggu! @${ctx.getId(mention)} sedang AFK ${mentionAfk.reason ? `dengan alasan ${ctx.format.inlineCode(mentionAfk.reason)}` : "tanpa alasan"} selama ${timeago}.`),
                            mentions: [mention]
                        });
                    }
                }
            }
        }

        if (isPrivate && (!isCmd || isCmd?.didyoumean)) console.log(util.styleText("magenta", "[~]"), `Incoming message from: ${senderId}`);
    });
};
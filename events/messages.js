const util = require("node:util");
const moment = require("moment-timezone");

async function WarningHandler(ctx, senderJid, senderId, senderLid, groupJid, groupDb) {
    const maxWarnings = groupDb?.maxwarnings || 3;
    const warnings = groupDb?.warnings || [];
    const senderWarning = warnings.find(warning => ctx.helper.areJidsSameUser(warning.jid, senderLid));
    let currentWarnings = senderWarning ? senderWarning.count : 0;
    currentWarnings += 1;

    if (senderWarning) {
        senderWarning.count = currentWarnings;
    } else {
        warnings.push({
            jid: senderLid,
            count: currentWarnings
        });
    }
    groupDb.warnings = warnings;

    await ctx.reply({
        text: ctx.format.info(`Warning ${currentWarnings}/${maxWarnings} untuk @${ctx.getId(senderId)}!`),
        mentions: [senderJid]
    });

    if (currentWarnings >= maxWarnings) {
        const isBotAdmin = await ctx.group(groupJid, !config.system.selfReply).isBotAdmin();
        if (isBotAdmin) {
            await ctx.reply(ctx.format.info(`Anda telah menerima ${maxWarnings} warning dan akan dikeluarkan dari grup!`));
            if (!config.system.restrict) await ctx.group().kick(senderJid);
            groupDb.warnings = warnings.filter(warning => warning.jid !== senderLid);
        } else {
            await ctx.reply(ctx.format.info(`${config.msg.botAdmin} Tidak dapat mengeluarkan Anda yang telah mencapai ${maxWarnings} warning.`));
        }
    }
    groupDb.save();
}

module.exports = (bot) => {
    bot.ev.on("MessagesUpsert", async (ctx) => {
        const {
            msg
        } = ctx;
        if (msg.key.fromMe) return;

        const isGroup = ctx.isGroup();
        const isPrivate = ctx.isPrivate();

        if (isGroup || isPrivate) {
            const senderJid = ctx.sender.jid;
            const senderId = ctx.getId(senderJid);
            const senderLid = ctx.sender.lid;
            const groupJid = isGroup ? ctx.id : null;
            const groupId = isGroup ? ctx.getId(groupJid) : null;
            const isOwner = ctx.sender.isOwner();
            const isCmd = ctx.isCmd();
            const isAdmin = isGroup ? await ctx.group().isSenderAdmin() : false;

            const botDb = ctx.db.bot;
            const senderDb = ctx.db.user;
            const groupDb = ctx.db.group;

            if (!senderDb || !groupDb) return;

            if (senderDb?.premium && Date.now() >= senderDb?.premiumExpiration) {
                senderDb.premium = false;
                senderDb.premiumExpiration = null;
                senderDb.coin = 100;
                senderDb.save();
            }
            senderDb.save();

            if (botDb?.mode === "premium" && !isOwner && !senderDb?.premium) return;
            if (botDb?.mode === "group" && isPrivate && !isOwner && !senderDb?.premium) return;
            if (botDb?.mode === "private" && isGroup && !isOwner && !senderDb?.premium) return;
            if (botDb?.mode === "self" && !isOwner) return;

            const now = moment().tz(config.system.timeZone);
            const hour = now.hour();
            if (config.system.unavailableAtNight && !isOwner && !senderDb?.premium && hour >= 0 && hour < 6) return;

            if (isCmd?.prefix && botDb?.lastPrefix !== isCmd.prefix) {
                botDb.lastPrefix = isCmd.prefix;
                botDb.save();
            }

            if (isCmd?.didyoumean)
                await ctx.reply({
                    text: ctx.format.info(`Apakah maksudmu ${ctx.format.inlineCode(isCmd.prefix + isCmd.didyoumean)}?`),
                    buttons: [{
                        text: "Ya, benar!",
                        id: `${isCmd.prefix + isCmd.didyoumean} ${isCmd.input}`
                    }]
                });

            const autodownloadEnabled = senderDb?.autodownload || false;
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

            const senderAfk = senderDb?.afk || {};
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
                    await ctx.reply(ctx.format.info(`Anda keluar AFK ${senderAfk.reason ? `dengan alasan ${ctx.format.inlineCode(senderAfk.reason)}` : "tanpa alasan"} selama ${timeago}. ${rewardMsg}`.trim()));
                    senderDb.afk = {};
                    senderDb.save();
                }
            }

            if (isGroup) {
                if (!isCmd || isCmd?.didyoumean) console.log(util.styleText("magenta", "[~]"), `Incoming message from group: ${groupId}, by: ${senderId}`);

                if (groupDb?.sewa && Date.now() >= senderDb?.sewaExpiration) {
                    senderDb.sewa = false;
                    senderDb.sewaExpiration = null;
                    groupDb.save();
                }

                if (groupDb?.mutebot) return;
                const muteList = groupDb?.mute || [];
                groupDb.mute = muteList.filter(mute => !mute.expiration || Date.now() >= mute.expiration);
                if (groupDb.mute.length !== muteList.length) groupDb.save();
                if (groupDb.mute.some(mute => mute.jid === ctx.sender.lid)) await ctx.deleteMessage(ctx.id, msg.key);

                let members = groupDb?.members || [];
                const existingMember = members.find(member => ctx.helper.areJidsSameUser(member.id, senderLid));
                if (existingMember) {
                    existingMember.sent = (existingMember.sent || 0) + 1;
                    if (ctx.sender.pushName) existingMember.pushName = ctx.sender.pushName;
                } else {
                    members.push({
                        id: senderLid,
                        sent: 1,
                        pushName: ctx.sender.pushName
                    });
                }
                groupDb.members = members;
                groupDb.save();

                const groupAutokick = groupDb?.option?.autokick;

                const afkMentions = ctx.quoted ? [ctx.quoted.sender] : await ctx.getMentioned();
                if (afkMentions.length > 0) {
                    for (const afkMention of afkMentions) {
                        const mentionAfk = ctx.getDb("users", afkMention)?.afk || {};
                        if (mentionAfk.reason || mentionAfk.timestamp) {
                            const timeago = ctx.format.convertMsToDuration(Date.now() - mentionAfk.timestamp);
                            await ctx.reply({
                                text: ctx.format.info(`Jangan ganggu! @${ctx.getId(afkMention)} sedang AFK ${mentionAfk.reason ? `dengan alasan ${ctx.format.inlineCode(mentionAfk.reason)}` : "tanpa alasan"} selama ${timeago}.`),
                                mentions: [afkMention]
                            });
                        }
                    }
                }

                if (!isCmd && !isOwner && !isAdmin) {
                    const antiTypes = ["audio", "document", "image", "sticker", "video"];
                    for (const type of antiTypes) {
                        if (groupDb?.option?.[`anti${type}`]) {
                            const isMedia = ctx.isMedia([type], ["primary"]);
                            if (!!isMedia) {
                                await ctx.reply(ctx.format.info(`Jangan kirim ${type}!`));
                                await ctx.deleteMessage(ctx.id, msg.key);
                                if (groupAutokick) {
                                    await ctx.group().kick(senderJid);
                                } else {
                                    await WarningHandler(ctx, senderJid, senderId, senderLid, groupJid, groupDb);
                                }
                            }
                        }
                    }

                    if (groupDb?.option?.antigcsw) {
                        const isMedia = msg.message?.groupStatusMessageV2?.contextInfo?.isGroupStatus;
                        if (isMedia) {
                            await ctx.reply(ctx.format.info("Jangan bikin SW di grup, gak ada yg peduli!"));
                            await ctx.deleteMessage(ctx.id, msg.key);
                            if (groupAutokick) {
                                await ctx.group().kick(senderJid);
                            } else {
                                await WarningHandler(ctx, senderJid, senderId, senderLid, groupJid, groupDb);
                            }
                        }
                    }

                    if (groupDb?.option?.antilink) {
                        if (msg.body && ctx.helper.isUrl(msg.body)) {
                            await ctx.reply(ctx.format.info("Jangan kirim link!"));
                            await ctx.deleteMessage(ctx.id, msg.key);
                            if (groupAutokick) {
                                await ctx.group().kick(senderJid);
                            } else {
                                await WarningHandler(ctx, senderJid, senderId, senderLid, groupJid, groupDb);
                            }
                        }
                    }

                    if (groupDb?.option?.antispam) {
                        const now = Date.now();
                        const spamData = groupDb?.spam || [];
                        const senderSpam = spamData.find(spam => ctx.helper.areJidsSameUser(spam.jid, senderLid)) || {
                            jid: senderLid,
                            count: 0,
                            lastMessageTime: 0
                        };
                        const timeDiff = now - senderSpam.lastMessageTime;
                        const newCount = timeDiff < 5000 ? senderSpam.count + 1 : 1;
                        senderSpam.count = newCount;
                        senderSpam.lastMessageTime = now;
                        if (!spamData.some(spam => ctx.helper.areJidsSameUser(spam.jid, senderLid))) spamData.push(senderSpam);
                        groupDb.spam = spamData;

                        if (newCount > 5) {
                            await ctx.reply(ctx.format.info("Jangan spam, ngelag woy!"));
                            await ctx.deleteMessage(ctx.id, msg.key);
                            if (groupAutokick) {
                                await ctx.group().kick(senderJid);
                            } else {
                                await WarningHandler(ctx, senderJid, senderId, senderLid, groupJid, groupDb);
                            }
                            groupDb.spam = spamData.filter(spam => spam.jid !== senderLid);
                        }
                        groupDb.save();
                    }

                    if (groupDb?.option?.antitagsw) {
                        const isMedia = msg.message?.protocolMessage?.type === 25;
                        if (isMedia) {
                            await ctx.reply(ctx.format.info("Jangan tag grup di SW, gak ada yg peduli!"));
                            await ctx.deleteMessage(ctx.id, msg.key);
                            if (groupAutokick) {
                                await ctx.group().kick(senderJid);
                            } else {
                                await WarningHandler(ctx, senderJid, senderId, senderLid, groupJid, groupDb);
                            }
                        }
                    }

                    if (groupDb?.option?.antitoxic) {
                        const toxicRegex = /anj(k|g)|ajn?(g|k)|a?njin(g|k)|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?(k|q)|pe?pe?(k|q)|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki ?(mak)?|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|asshole|dontol|kontoi|ontol/i;
                        if (msg.body && toxicRegex.test(msg.body)) {
                            await ctx.reply(ctx.format.info("Jangan toxic!"));
                            await ctx.deleteMessage(ctx.id, msg.key);
                            if (groupAutokick) {
                                await ctx.group().kick(senderJid);
                            } else {
                                await WarningHandler(ctx, senderJid, senderId, senderLid, groupJid, groupDb);
                            }
                        }
                    }
                }
            }

            if (isPrivate) {
                if (!isCmd || isCmd?.didyoumean) console.log(util.styleText("magenta", "[~]"), `Incoming message from: ${senderId}`);
            }
        }
    });
};

module.exports.WarningHandler = WarningHandler;
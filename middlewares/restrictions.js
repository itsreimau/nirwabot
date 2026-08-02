const { Cooldown } = require("../lib");
const moment = require("moment-timezone");

module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        const isGroup = ctx.isGroup();
        const isPrivate = ctx.isPrivate();
        const senderJid = ctx.sender.jid;
        const senderId = ctx.getId(senderJid);
        const groupJid = isGroup ? ctx.id : null;
        const isOwner = ctx.sender.isOwner();
        const isAdmin = isGroup ? await ctx.group().isSenderAdmin() : false;

        const botDb = ctx.db.bot;
        const senderDb = ctx.db.user;
        const groupDb = ctx.db.group;

        const simulateTyping = async () => {
            if (config.system.autoTypingOnCmd) await ctx.simulateTyping();
        };

        const restrictions = [{
            key: "banned",
            condition: senderDb?.banned && ctx.used.command !== "owner",
            msg: config.msg.banned,
            buttons: [{
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }],
            reaction: "🚫"
        }, {
            key: "cooldown",
            condition: new Cooldown(ctx, config.system.cooldown, "multi").onCooldown && !isOwner && !senderDb?.premium,
            msg: config.msg.cooldown,
            reaction: "💤"
        }, {
            key: "gamerestrict",
            condition: groupDb?.option?.gamerestrict && isGroup && !isOwner && !isAdmin && ctx.bot.cmd.get(ctx.used.command).category === "game",
            msg: config.msg.gamerestrict,
            reaction: "🎮"
        }, {
            key: "privatePremiumOnly",
            condition: config.system.privatePremiumOnly && !isOwner && !senderDb?.premium && !["price", "owner"].includes(ctx.used.command),
            msg: config.msg.privatePremiumOnly,
            buttons: [{
                text: "Harga Premium",
                id: `${ctx.used.prefix}price`
            }, {
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }],
            reaction: "💎"
        }, {
            key: "requireBotGroupMembership",
            condition: await (async () => {
                if (!config.system.requireBotGroupMembership || isOwner || senderDb?.premium || ctx.used.command === "botgroup" || !config.bot.groupJid) return false;
                const now = Date.now();
                const duration = 24 * 60 * 60 * 1000;
                if (senderDb?.botGroupMembership?.isMember && now - senderDb?.botGroupMembership?.timestamp < duration) return senderDb.botGroupMembership.isMember;
                const isMember = await ctx.group(config.bot.groupJid).isMemberExist(ctx.sender.lid);
                senderDb.botGroupMembership = {
                    isMember,
                    timestamp: now
                };
                senderDb.save();
                return isMember;
            })(),
            msg: config.msg.botGroupMembership,
            buttons: [{
                text: "Grup Bot",
                id: `${ctx.used.prefix}botgroup`
            }],
            reaction: "🚫"
        }, {
            key: "requireGroupSewa",
            condition: config.system.requireGroupSewa && isGroup && !isOwner && !["price", "owner"].includes(ctx.used.command) && groupDb?.sewa !== true,
            msg: config.msg.groupSewa,
            buttons: [{
                text: "Harga Sewa",
                id: `${ctx.used.prefix}price`
            }, {
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }],
            reaction: "🔒"
        }, {
            key: "unavailableAtNight",
            condition: (() => {
                if (!config.system.unavailableAtNight || isOwner || senderDb?.premium) return false;
                const now = moment().tz(config.system.timeZone);
                const hour = now.hour();
                return hour >= 0 && hour < 6;
            })(),
            msg: config.msg.unavailableAtNight,
            reaction: "😴"
        }];

        for (const {
                condition,
                msg,
                reaction,
                key,
                buttons
            }
            of restrictions) {
            if (condition) {
                const now = Date.now();
                const lastSentMsg = senderDb?.lastSentMsg?.[key] || 0;
                const oneDay = 24 * 60 * 60 * 1000;
                if (!lastSentMsg || (now - lastSentMsg) > oneDay) {
                    await simulateTyping();
                    (senderDb.lastSentMsg ||= {})[key] = now;
                    senderDb.save();
                    return await ctx.reply({
                        text: ctx.format.info(`${msg} Respon selanjutnya akan berupa reaksi emoji ${ctx.format.inlineCode(reaction)}.`),
                        buttons: buttons || null
                    });
                } else {
                    return await ctx.replyReact(reaction);
                }
            }
        }

        await next();
    });
};
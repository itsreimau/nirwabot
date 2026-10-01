const { Cooldown } = require("../lib");
const moment = require("moment-timezone");

module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        const isGroup = ctx.isGroup();
        const isPrivate = ctx.isPrivate();
        const isOwner = ctx.sender.isOwner();
        const isAdmin = isGroup ? await ctx.group().isSenderAdmin() : false;

        const senderDb = ctx.db.user;
        const groupDb = ctx.db.group;
        const botDb = ctx.db.bot;

        const deny = async (key, msg, reaction, buttons) => {
            const now = Date.now();
            const lastSent = senderDb.lastSentMsg?.[key] || 0;
            if (!lastSent || (now - lastSent) > (24 * 60 * 60 * 1000)) {
                if (config.system.autoTypingOnCmd) await ctx.simulateTyping();
                senderDb.lastSentMsg[key] = now;
                senderDb.save();
                return await ctx.reply({
                    text: ctx.format.info(`${msg} (berikutnya: reaksi ${ctx.format.inlineCode(reaction)})`),
                    buttons
                });
            }
            return await ctx.replyReact(reaction);
        };

        if (senderDb.banned && ctx.used.command !== "owner")
            return deny("banned", config.msg.banned, "🚫", [{
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }]);
        if (new Cooldown(ctx, config.system.cooldown).onCooldown && !isOwner && !senderDb.premium) return deny("cooldown", config.msg.cooldown, "💤");
        if (groupDb.option?.gamerestrict && isGroup && !isOwner && !isAdmin && ctx.bot.cmd.get(ctx.used.command).category === "game") return deny("gamerestrict", config.msg.gamerestrict, "🎮");
        if (config.system.privatePremiumOnly && isPrivate && !isOwner && !senderDb.premium && !["price", "owner"].includes(ctx.used.command))
            return deny("privatePremiumOnly", config.msg.privatePremiumOnly, "💎", [{
                text: "Harga Premium",
                id: `${ctx.used.prefix}price`
            }, {
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }]);
        if (config.system.requireBotGroupMembership && !isOwner && !senderDb.premium && ctx.used.command !== "botgroup" && config.bot.groupJid) {
            const now = Date.now();
            const cooldown = senderDb.botGroupMembership?.isMember ? 24 * 60 * 60 * 1000 : 2 * 60 * 1000;
            let isMember = senderDb.botGroupMembership?.isMember || false;
            if (now - (senderDb.botGroupMembership?.timestamp || 0) > cooldown) {
                isMember = await ctx.group(config.bot.groupJid).isMemberExist(ctx.sender.jid);
                senderDb.botGroupMembership = {
                    isMember,
                    timestamp: now
                };
                senderDb.save();
            }
            if (!isMember)
                return deny("requireBotGroupMembership", config.msg.botGroupMembership, "🚫", [{
                    text: "Grup Bot",
                    id: `${ctx.used.prefix}botgroup`
                }]);
        }
        if (config.system.requireGroupSewa && isGroup && !isOwner && !["price", "owner"].includes(ctx.used.command) && !groupDb.sewa)
            return deny("requireGroupSewa", config.msg.groupSewa, "🔒", [{
                text: "Harga Sewa",
                id: `${ctx.used.prefix}price`
            }, {
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }]);
        if (config.system.unavailableAtNight && !isOwner && !senderDb.premium) {
            const hour = moment().tz(config.system.timeZone).hour();
            if (hour >= 0 && hour < 6) return deny("unavailableAtNight", config.msg.unavailableAtNight, "😴");
        }

        const command = [...ctx.bot.cmd.values()].find(c => [c.name, ...(c?.aliases || [])].includes(ctx.used.command));
        const perms = command.permissions || {};
        if (perms.restrict && config.system.restrict) return deny("restrict", config.msg.restrict, "🚫");
        if (perms.owner && !isOwner) return deny("owner", config.msg.owner, "👑");
        if (perms.premium && !senderDb.premium && !isOwner)
            return deny("premium", config.msg.premium, "💎", [{
                text: "Harga Premium",
                id: `${ctx.used.prefix}price`
            }, {
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }]);
        if (perms.admin && isGroup && !isAdmin && !isOwner) return deny("admin", config.msg.admin, "🛡️");
        if (perms.botAdmin && isGroup && !await ctx.group(ctx.id, !config.system.selfReply).isBotAdmin()) return deny("botAdmin", config.msg.botAdmin, "🤖");
        if (perms.group && isPrivate) return deny("group", config.msg.group, "👥");
        if (perms.private && isGroup) return deny("private", config.msg.private, "📩");
        if (perms.ticket && config.system.useTicket && !isOwner) {
            if (senderDb.ticket >= 1) {
                senderDb.ticket -= 1;
                senderDb.save();
            } else return deny("ticket", config.msg.ticket, "🎟️", [{
                text: "Tukar Skor",
                id: `${ctx.used.prefix}exchange`
            }]);
        }

        if (config.system.autoTypingOnCmd) await ctx.simulateTyping();
        await next();
    });
};
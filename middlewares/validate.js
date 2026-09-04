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

        const restrict = async (key, msg, reaction, buttons) => {
            const now = Date.now();
            const lastSent = senderDb.lastSentMsg?.[key] || 0;
            const oneDay = 24 * 60 * 60 * 1000;
            if (!lastSent || (now - lastSent) > oneDay) {
                if (config.system.autoTypingOnCmd) await ctx.simulateTyping();
                senderDb.lastSentMsg[key] = now;
                senderDb.save();
                return await ctx.reply({
                    text: ctx.format.info(`${msg} — selanjutnya akan berupa reaksi emoji ${ctx.format.inlineCode(reaction)}.`),
                    buttons
                });
            } else {
                return await ctx.replyReact(reaction);
            }
        };

        const command = [...ctx.bot.cmd.values()].find(cmd => [cmd.name, ...(cmd?.aliases || [])].includes(ctx.used.command));
        if (command) {
            const perms = command.permissions || {};
            if (perms.admin && isGroup && !isAdmin && !isOwner) return restrict("admin", config.msg.admin, "🛡️");
            if (perms.botAdmin && isGroup && !await ctx.group(ctx.id, !config.system.selfReply).isBotAdmin()) return restrict("botAdmin", config.msg.botAdmin, "🤖");
            if (perms.coin && config.system.useCoin && !isOwner && !senderDb.premium) {
                if (senderDb.coin >= perms.coin) {
                    senderDb.coin -= perms.coin;
                    senderDb.save();
                } else {
                    return restrict("coin", config.msg.coin, "💰", [{
                        text: "Cek Koin",
                        id: `${ctx.used.prefix}coin`
                    }]);
                }
            }
            if (perms.group && isPrivate) return restrict("group", config.msg.group, "👥");
            if (perms.owner && !isOwner) return restrict("owner", config.msg.owner, "👑");
            if (perms.premium && !senderDb.premium && !isOwner)
                return restrict("premium", config.msg.premium, "💎", [{
                    text: "Harga Premium",
                    id: `${ctx.used.prefix}price`
                }, {
                    text: "Hubungi Owner",
                    id: `${ctx.used.prefix}owner`
                }]);
            if (perms.private && isGroup) return restrict("private", config.msg.private, "📩");
            if (perms.restrict && config.system.restrict) return restrict("restrict", config.msg.restrict, "🚫");
        }

        if (senderDb.banned && ctx.used.command !== "owner")
            return restrict("banned", config.msg.banned, "🚫", [{
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }]);
        if (new Cooldown(ctx, config.system.cooldown, "multi").onCooldown && !isOwner && !senderDb.premium) return restrict("cooldown", config.msg.cooldown, "💤");
        if (groupDb.option?.gamerestrict && isGroup && !isOwner && !isAdmin && ctx.bot.cmd.get(ctx.used.command).category === "game") return restrict("gamerestrict", config.msg.gamerestrict, "🎮");
        if (config.system.privatePremiumOnly && isPrivate && !isOwner && !senderDb.premium && !["price", "owner"].includes(ctx.used.command))
            return restrict("privatePremiumOnly", config.msg.privatePremiumOnly, "💎", [{
                text: "Harga Premium",
                id: `${ctx.used.prefix}price`
            }, {
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }]);
        if (config.system.requireBotGroupMembership && !isOwner && !senderDb.premium && ctx.used.command !== "botgroup" && config.bot.groupJid) {
            const now = Date.now();
            const duration = 24 * 60 * 60 * 1000;
            let isMember = senderDb.botGroupMembership?.isMember;
            if (isMember === undefined || (now - (senderDb.botGroupMembership?.timestamp || 0)) > duration) {
                isMember = await ctx.group(config.bot.groupJid).isMemberExist(ctx.sender.lid);
                senderDb.botGroupMembership = {
                    isMember,
                    timestamp: now
                };
                senderDb.save();
            }
            if (!isMember)
                return restrict("requireBotGroupMembership", config.msg.botGroupMembership, "🚫", [{
                    text: "Grup Bot",
                    id: `${ctx.used.prefix}botgroup`
                }]);
        }
        if (config.system.requireGroupSewa && isGroup && !isOwner && !["price", "owner"].includes(ctx.used.command) && !groupDb.sewa)
            return restrict("requireGroupSewa", config.msg.groupSewa, "🔒", [{
                text: "Harga Sewa",
                id: `${ctx.used.prefix}price`
            }, {
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }]);
        if (config.system.unavailableAtNight && !isOwner && !senderDb.premium) {
            const hour = moment().tz(config.system.timeZone).hour();
            if (hour >= 0 && hour < 6) return restrict("unavailableAtNight", config.msg.unavailableAtNight, "😴");
        }

        if (config.system.autoTypingOnCmd) await ctx.simulateTyping();
        await next();
    });
};
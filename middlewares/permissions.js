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

        const command = [...ctx.bot.cmd.values()].find(cmd => [cmd.name, ...(cmd?.aliases || [])].includes(ctx.used.command));
        if (!command) return await next();

        const {
            permissions = {}
        } = command;
        const permissionChecks = [{
            key: "admin",
            condition: isGroup && !isAdmin && !isOwner,
            msg: config.msg.admin,
            reaction: "🛡️"
        }, {
            key: "botAdmin",
            condition: isGroup && !await ctx.group(groupJid, !config.system.selfReply).isBotAdmin(),
            msg: config.msg.botAdmin,
            reaction: "🤖"
        }, {
            key: "coin",
            condition: (() => {
                if (!config.system.useCoin || isOwner || senderDb?.premium) return false;
                if (senderDb?.coin >= permissions.coin) {
                    senderDb.coin -= permissions.coin;
                    senderDb.save();
                    return false;
                }
                return true;
            })(),
            msg: config.msg.coin,
            buttons: [{
                text: "Cek Koin",
                id: `${ctx.used.prefix}coin`
            }],
            reaction: "💰"
        }, {
            key: "group",
            condition: isPrivate,
            msg: config.msg.group,
            reaction: "👥"
        }, {
            key: "owner",
            condition: !isOwner,
            msg: config.msg.owner,
            reaction: "👑"
        }, {
            key: "premium",
            condition: !senderDb?.premium && !isOwner,
            msg: config.msg.premium,
            buttons: [{
                text: "Harga Premium",
                id: `${ctx.used.prefix}price`
            }, {
                text: "Hubungi Owner",
                id: `${ctx.used.prefix}owner`
            }],
            reaction: "💎"
        }, {
            key: "private",
            condition: isGroup,
            msg: config.msg.private,
            reaction: "📩"
        }, {
            key: "restrict",
            condition: config.system.restrict,
            msg: config.msg.restrict,
            reaction: "🚫"
        }];

        for (const {
                key,
                condition,
                msg,
                reaction,
                buttons
            }
            of permissionChecks) {
            if (permissions[key] && condition) {
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

        await simulateTyping();
        await next();
    });
};
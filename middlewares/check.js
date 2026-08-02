const util = require("node:util");

module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        const isGroup = ctx.isGroup();
        const isPrivate = ctx.isPrivate();
        const senderJid = ctx.sender.jid;
        const senderId = ctx.getId(senderJid);
        const groupJid = isGroup ? ctx.id : null;
        const groupId = isGroup ? ctx.getId(groupJid) : null;
        const isOwner = ctx.sender.isOwner();
        const isAdmin = isGroup ? await ctx.group().isSenderAdmin() : false;

        const botDb = ctx.db.bot;
        const senderDb = ctx.db.user;
        const groupDb = ctx.db.group;

        if (!senderDb || !groupDb) return;

        if (botDb?.mode === "premium" && !isOwner && !senderDb?.premium) return;
        if (botDb?.mode === "group" && isPrivate && !isOwner && !senderDb?.premium) return;
        if (botDb?.mode === "private" && isGroup && !isOwner && !senderDb?.premium) return;
        if (botDb?.mode === "self" && !isOwner) return;

        if (groupDb?.mutebot && !(isOwner || isAdmin) && !(ctx.used.command === "unmute" && ctx.args[0]?.toLowerCase() === "bot")) return;
        const muteList = groupDb?.mute || [];
        if (muteList.some(mute => mute.jid === ctx.sender.lid)) return;

        if (isGroup && !ctx.msg.key.fromMe && ctx.prefix !== "force") {
            console.log(util.styleText("magenta", "[~]"), `Incoming command: ${ctx.used.command}, from group: ${groupId}, by: ${senderId}`);
        } else if (isPrivate && !ctx.msg.key.fromMe) {
            console.log(util.styleText("magenta", "[~]"), `Incoming command: ${ctx.used.command}, from: ${senderId}`);
        }

        await next();
    });
};
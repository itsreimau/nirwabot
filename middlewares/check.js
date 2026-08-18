const util = require("node:util");

module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        const isGroup = ctx.isGroup();
        const isPrivate = ctx.isPrivate();
        const senderId = ctx.getId(ctx.sender.jid);
        const groupId = isGroup ? ctx.getId(ctx.id) : null;
        const isOwner = ctx.sender.isOwner();

        const botDb = ctx.db.bot;
        const senderDb = ctx.db.user;

        if (botDb?.mode === "premium" && !isOwner && !senderDb?.premium) return;
        if (botDb?.mode === "group" && isPrivate && !isOwner && !senderDb?.premium) return;
        if (botDb?.mode === "private" && isGroup && !isOwner && !senderDb?.premium) return;
        if (botDb?.mode === "self" && !isOwner) return;

        if (isGroup) {
            const groupDb = ctx.db.group;
            if (groupDb?.mutebot && !isOwner && !await ctx.group().isSenderAdmin() && !(ctx.used.command === "unmute" && ctx.args[0]?.toLowerCase() === "bot")) return;
            const muteList = groupDb?.mute || [];
            if (muteList.some(mute => mute.jid === ctx.sender.lid)) return;
        }

        if (ctx.prefix !== "force") {
            if (isGroup && !ctx.msg.key.fromMe) {
                console.log(util.styleText("magenta", "[~]"), `Incoming command: ${ctx.used.command}, from group: ${groupId}, by: ${senderId}`);
            } else if (isPrivate && !ctx.msg.key.fromMe) {
                console.log(util.styleText("magenta", "[~]"), `Incoming command: ${ctx.used.command}, from: ${senderId}`);
            }
        }

        await next();
    });
};
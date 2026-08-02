module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        const senderDb = ctx.db.user;
        const xpGain = 10;
        const xpToLevelUp = 100;
        let newSenderXp = (senderDb?.xp || 0) + xpGain;
        if (newSenderXp >= xpToLevelUp) {
            const senderLevel = senderDb?.level || 0;
            senderDb.level = senderLevel + 1;
            newSenderXp -= xpToLevelUp;
        }
        senderDb.xp = newSenderXp;
        senderDb.save();

        if (ctx.isGroup() && !ctx.msg.key.fromMe) {
            const groupDb = ctx.db.group;
            let members = groupDb?.members || [];
            const senderLid = ctx.sender.lid;
            const existingMember = members.find(member => ctx.helper.areJidsSameUser(member.id, senderLid));

            if (existingMember) {
                existingMember.sent = (existingMember.sent || 0) + 1;
                if (ctx.sender.pushName) existingMember.pushName = ctx.sender.pushName;
            } else {
                const groupMembers = await ctx.group().members();
                const memberData = groupMembers.find(member => ctx.helper.areJidsSameUser(member.id, senderLid));
                members.push({
                    id: senderLid,
                    sent: 1,
                    pushName: ctx.sender.pushName
                });
            }

            groupDb.members = members;
            groupDb.save();
        }

        await next();
    });
};
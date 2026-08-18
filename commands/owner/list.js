module.exports = [{
    name: "listbanuser",
    aliases: ["listban", "listbanned", "listbanneduser"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const users = ctx.db.users.getMany(user => user.banned);
        let resultText = "";
        let userMentions = [];
        for (const user of users) {
            const userId = ctx.getId(user.jid);
            resultText += `❖ @${userId}\n`;
            userMentions.push(user.jid);
        }
        await ctx.reply({
            text: resultText.trim() || ctx.format.info(config.msg.notFound),
            mentions: userMentions
        });
    }
}, {
    name: "listpremiumuser",
    aliases: ["listprem", "listpremium"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const users = ctx.db.users.getMany(user => user.premium);
        let resultText = "";
        let userMentions = [];
        for (const user of users) {
            const userId = ctx.getId(user.jid);
            userMentions.push(user.jid);
            if (user.premiumExpiration) {
                const daysLeft = ctx.format.convertMsToDuration(user.premiumExpiration - Date.now(), ["hari", "jam"]);
                resultText += `❖ @${userId} (${daysLeft} tersisa)\n`;
            } else {
                resultText += `❖ @${userId} (Permanen)\n`;
            }
        }
        await ctx.reply({
            text: resultText.trim() || ctx.format.info(config.msg.notFound),
            mentions: userMentions
        });
    }
}, {
    name: "listsewagroup",
    aliases: ["listsewa"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const groups = ctx.db.groups.getMany(group => group.sewa);
        let resultText = "";
        let groupMentions = [];
        for (const group of groups) {
            const groupSubject = await ctx.group(group.jid).name();
            groupMentions.push({
                groupJid: group.jid,
                groupSubject
            });
            if (group.sewaExpiration) {
                const daysLeft = ctx.format.convertMsToDuration(group.sewaExpiration - Date.now(), ["hari", "jam"]);
                resultText += `❖ @${group.jid} (${daysLeft} tersisa)\n`;
            } else {
                resultText += `❖ @${group.jid} (Permanen)\n`;
            }
        }
        await ctx.reply({
            text: resultText.trim() || ctx.format.info(config.msg.notFound),
            contextInfo: {
                groupMentions
            }
        });
    }
}];
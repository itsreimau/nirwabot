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
            const userId = ctx.getId(user.id);
            resultText += `❖ @${userId}\n`;
            userMentions.push(user.id);
        }
        await ctx.reply({
            text: resultText.trim() || ctx.format.info(config.msg.notFound),
            mentions: userMentions
        });
    }
}, {
    name: "listgroup",
    aliases: ["listgc"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const groups = Object.values(await ctx.core.groupFetchAllParticipating()).filter(g => !g.announce && !g.isCommunity && !g.isCommunityAnnounce);
        const groupList = Object.values(groups);
        let groupMentions = [];
        const resultText = groupList.map(group =>
            `❖ ${ctx.format.bold("Nama")}: ${group.subject}\n` +
            `❖ ${ctx.format.bold("ID")}: ${group.id}`
        ).join("\n\n");
        await ctx.reply(resultText.trim() || ctx.format.info(config.msg.notFound));
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
            const userId = ctx.getId(user.id);
            userMentions.push(user.id);
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
            const groupSubject = await ctx.group(group.id).name();
            groupMentions.push({
                groupJid: group.id,
                groupSubject
            });
            if (group.sewaExpiration) {
                const daysLeft = ctx.format.convertMsToDuration(group.sewaExpiration - Date.now(), ["hari", "jam"]);
                resultText += `❖ @${group.id} (${daysLeft} tersisa)\n`;
            } else {
                resultText += `❖ @${group.id} (Permanen)\n`;
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
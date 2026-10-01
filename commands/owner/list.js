module.exports = [{
    name: "listbanuser",
    aliases: ["listban", "listbanned", "listbanneduser"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const users = ctx.db.users.getMany(user => user.banned);
        const mentions = users.map(user => user.id);
        const text = users.map(user => `❖ @${ctx.getId(user.id)}`).join("\n");
        await ctx.reply({
            text: text.trim() || ctx.format.info(config.msg.notFound),
            mentions
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
        const groups = Object.values(await ctx.core.groupFetchAllParticipating()).filter(group => !group.announce && !group.isCommunity && !group.isCommunityAnnounce);
        const text = groups.map(group =>
            `❖ ${ctx.format.bold("Nama")}: ${group.subject}\n` +
            `❖ ${ctx.format.bold("ID")}: ${group.id}`
        ).join("\n\n");
        await ctx.reply(text.trim() || ctx.format.info(config.msg.notFound));
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
        const mentions = users.map(user => user.id);
        const text = users.map(user => {
            const info = user.premiumExpiration ? `${ctx.format.convertMsToDuration(user.premiumExpiration - Date.now(), ["hari", "jam"])} tersisa` : "Permanen";
            return `❖ @${ctx.getId(user.id)} (${info})`;
        }).join("\n");
        await ctx.reply({
            text: text.trim() || ctx.format.info(config.msg.notFound),
            mentions
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
        const groupMentions = [];
        const text = (await Promise.all(groups.map(async (group) => {
            const groupSubject = await ctx.group(group.id).name();
            groupMentions.push({
                groupJid: group.id,
                groupSubject
            });
            const info = group.sewaExpiration ? `${ctx.format.convertMsToDuration(group.sewaExpiration - Date.now(), ["hari", "jam"])} tersisa` : "Permanen";
            return `❖ @${group.id} (${info})`;
        }))).join("\n");
        await ctx.reply({
            text: text.trim() || ctx.format.info(config.msg.notFound),
            contextInfo: {
                groupMentions
            }
        });
    }
}];
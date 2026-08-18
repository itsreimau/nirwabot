module.exports = [{
    name: "listmute",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const muteList = ctx.db.group?.mute || [];
        let resultText = "";
        let userMentions = [];
        for (const mutedUser of muteList) {
            const userId = ctx.getId(mutedUser.jid);
            userMentions.push(mutedUser.jid);
            if (mutedUser.expiration) {
                const timeDiff = mutedUser.expiration - Date.now();
                const daysLeft = ctx.format.convertMsToDuration(timeDiff, ["hari", "jam"]);
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
    name: "listpendingmembers",
    aliases: ["pendingmembers"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const pendings = await ctx.group().pendingMembers();
        const resultText = pendings.map(pending => `❖ ${ctx.getId(pending.id)}`).join("\n");
        await ctx.reply(resultText.trim() || ctx.format.info(config.msg.notFound));
    }
}, {
    name: "listwarning",
    aliases: ["listwarn"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const warnings = ctx.db.group?.warnings || [];
        let resultText = "";
        let userMentions = [];
        for (const warning of warnings) {
            const userId = ctx.getId(warning.jid);
            userMentions.push(warning.jid);
            resultText += `❖ @${userId} (${warning.count}/${ctx.db.group?.maxwarnings || 3})\n`;
        }
        await ctx.reply({
            text: resultText.trim() || ctx.format.info(config.msg.notFound),
            mentions: userMentions
        });
    }
}];
module.exports = [{
    name: "listmute",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const muteList = ctx.db.group.mute;
        const mentions = muteList.map(mute => mute.id);
        const text = muteList.map(mute => {
            const info = mute.expiration ? `${ctx.format.convertMsToDuration(mute.expiration - Date.now(), ["hari", "jam"])} tersisa` : "Permanen";
            return `❖ @${ctx.getId(mute.id)} (${info})`;
        }).join("\n");
        await ctx.reply({
            text: text.trim() || ctx.format.info(config.msg.notFound),
            mentions
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
        const text = pendings.map(pending => `❖ ${ctx.getId(pending.lid)}`).join("\n");
        await ctx.reply(text.trim() || ctx.format.info(config.msg.notFound));
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
        const warnings = ctx.db.group.warnings;
        const mentions = warnings.map(warning => warning.id);
        const text = warnings.map(warning => `❖ @${ctx.getId(warning.id)} (${warning.count}/${ctx.db.group.maxwarnings})`).join("\n");
        await ctx.reply({
            text: text.trim() || ctx.format.info(config.msg.notFound),
            mentions
        });
    }
}];
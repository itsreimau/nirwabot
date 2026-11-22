module.exports = [{
    name: "tagall",
    category: "group",
    permissions: {
        admin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        const members = await ctx.group().members();
        const mentions = members.map(member => member.id);
        const text = mentions.map(id => `@${ctx.getId(id)}`).join(" ");
        await ctx.reply({
            text: `${input || `>ᴗ< ${ctx.format.italic("Halo, Dunia!")}`}\n` +
                `${"\u200E".repeat(4001)}\n` +
                text,
            mentions
        });
    }
}, {
    name: "hidetag",
    aliases: ["h", "ht"],
    category: "group",
    permissions: {
        admin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        await ctx.reply({
            text: input || `>ᴗ< ${ctx.format.italic("Halo, Dunia!")}`,
            mentionAll: true
        });
    }
}, {
    name: "tagme",
    category: "group",
    permissions: {
        group: true
    },
    code: async (ctx) => {
        await ctx.reply({
            text: `@${ctx.getId(ctx.sender.jid)}`,
            mentions: [ctx.sender.jid]
        });
    }
}];
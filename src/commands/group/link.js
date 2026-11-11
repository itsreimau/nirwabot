module.exports = {
    name: "link",
    aliases: ["gclink", "grouplink"],
    category: "group",
    permissions: {
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const code = await ctx.group().inviteCode();
        await ctx.reply(`https://chat.whatsapp.com/${code}`);
    }
};
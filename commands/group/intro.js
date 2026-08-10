module.exports = {
    name: "intro",
    category: "group",
    permissions: {
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const introText = ctx.db.group.text?.intro;
        await ctx.reply(introText || ctx.format.info("Grup ini tidak memiliki intro."));
    }
};
module.exports = {
    name: "autodownload",
    aliases: ["autodl"],
    category: "profile",
    code: async (ctx) => {
        const senderDb = ctx.db.user;
        const newStatus = !senderDb.autodownload;
        senderDb.autodownload = newStatus;
        senderDb.save();
        await ctx.reply(ctx.format.info(`Auto download ${newStatus ? "aktif" : "nonaktif"}.`));
    }
};
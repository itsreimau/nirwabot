const pkg = require("../../package.json");

module.exports = {
    name: "about",
    aliases: ["bot", "infobot"],
    category: "information",
    code: async (ctx) => {
        const groups = Object.values(await ctx.core.groupFetchAllParticipating()).filter(g => !g.announce && !g.isCommunity && !g.isCommunityAnnounce);
        await ctx.reply(
            `✦ — Halo! Saya adalah bot WhatsApp bernama ${config.bot.name}, dimiliki oleh ${config.owner.name}. Saya bisa melakukan banyak perintah, seperti membuat stiker, menggunakan AI untuk pekerjaan tertentu, dan beberapa perintah berguna lainnya. Saya di sini untuk menghibur dan menyenangkan Anda!\n` +
            "\n" +
            `❖ ${ctx.format.bold("Bot")}: ${config.bot.name}\n` +
            `❖ ${ctx.format.bold("Versi")}: ${pkg.version}\n` +
            `❖ ${ctx.format.bold("Owner")}: ${config.owner.name}\n` +
            `❖ ${ctx.format.bold("Mode")}: ${ctx.format.ucwords(ctx.db.bot?.mode || "public")}\n` +
            `❖ ${ctx.format.bold("Uptime")}: ${ctx.format.convertMsToDuration(Date.now() - ctx.me.readyAt)}\n` +
            `❖ ${ctx.format.bold("Database")}: ${ctx.db.users.totalEntries} users, ${ctx.db.groups.totalEntries}/${groups.length} groups\n` +
            `❖ ${ctx.format.bold("Library")}: Baileys (${ctx.helper.getBaileysVersion()})`
        );
    }
};
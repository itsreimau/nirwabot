const os = require("node:os");

module.exports = {
    name: "server",
    category: "information",
    code: async (ctx) => {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const cpus = os.cpus();
        const groups = Object.values(await ctx.core.groupFetchAllParticipating()).filter(g => !g.announce && !g.isCommunity && !g.isCommunityAnnounce);

        await ctx.reply(
            `❖ ${ctx.format.bold("OS")}: ${os.type()} (${os.platform()})\n` +
            `❖ ${ctx.format.bold("Arch")}: ${os.arch()}\n` +
            `❖ ${ctx.format.bold("Release")}: ${os.release()}\n` +
            `❖ ${ctx.format.bold("Host")}: ${os.hostname()}\n` +
            "\n" +
            `❖ ${ctx.format.bold("Memori")}: ${ctx.format.formatSize(usedMem)}\n` +
            `❖ ${ctx.format.bold("Bebas")}: ${ctx.format.formatSize(freeMem)}\n` +
            `❖ ${ctx.format.bold("Total")}: ${ctx.format.formatSize(totalMem)}\n` +
            "\n" +
            `❖ ${ctx.format.bold("Model CPU")}: ${cpus[0].model}\n` +
            `❖ ${ctx.format.bold("Kecepatan CPU")}: ${cpus[0].speed}\n` +
            `❖ ${ctx.format.bold("Cores CPU")}: ${cpus.length}\n` +
            `❖ ${ctx.format.bold("Muat Rata-Rata")}: ${os.loadavg().map(avg => avg.toFixed(2)).join(", ")}\n` +
            "\n" +
            `❖ ${ctx.format.bold("Versi NodeJS")}: ${process.version}\n` +
            `❖ ${ctx.format.bold("Jalur Exec")}: ${process.execPath}\n` +
            `❖ ${ctx.format.bold("PID")}: ${process.pid}\n` +
            "\n" +
            `❖ ${ctx.format.bold("Uptime")}: ${ctx.format.convertMsToDuration(Date.now() - ctx.me.readyAt)}\n` +
            `❖ ${ctx.format.bold("Database")}: ${ctx.db.users.totalEntries} users, ${ctx.db.groups.totalEntries}/${groups.length} groups\n` +
            `❖ ${ctx.format.bold("Library")}: Baileys (${ctx.helper.getBaileysVersion()})`
        );
    }
};
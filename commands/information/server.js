const os = require("node:os");

module.exports = {
    name: "server",
    category: "information",
    code: async (ctx) => {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const cpus = os.cpus();
        const groups = Object.values(await ctx.core.groupFetchAllParticipating()).filter(g => !g.announce && !g.isCommunity && !g.isCommunityAnnounce && !g.restrict);
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
            `❖ ${ctx.format.bold("CPU")}: ${cpus[0].model}\n` +
            `❖ ${ctx.format.bold("Speed")}: ${cpus[0].speed}\n` +
            `❖ ${ctx.format.bold("Cores")}: ${cpus.length}\n` +
            `❖ ${ctx.format.bold("Load")}: ${os.loadavg().map(avg => avg.toFixed(2)).join(", ")}\n` +
            "\n" +
            `❖ ${ctx.format.bold("Node")}: ${process.version}\n` +
            `❖ ${ctx.format.bold("Exec")}: ${process.execPath}\n` +
            `❖ ${ctx.format.bold("PID")}: ${process.pid}\n` +
            "\n" +
            `❖ ${ctx.format.bold("Uptime")}: ${ctx.format.convertMsToDuration(Date.now() - ctx.me.readyAt)}\n` +
            `❖ ${ctx.format.bold("Database")}: ${ctx.db.users.totalEntries} user, ${ctx.db.groups.totalEntries}/${groups.length} grup\n` +
            `❖ ${ctx.format.bold("Library")}: Baileys (${ctx.helper.getBaileysVersion()})`
        );
    }
};
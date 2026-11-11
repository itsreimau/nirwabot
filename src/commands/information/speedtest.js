const { SpeedTestService } = require("@ginkohub/speedtest-js");

module.exports = {
    name: "speedtest",
    aliases: ["speed"],
    category: "information",
    code: async (ctx) => {
        const speedtestMsg = await ctx.reply(ctx.format.info("Memulai speedtest..."));
        await ctx.edit(ctx.format.info("Ambil info client..."), speedtestMsg.key);
        const service = new SpeedTestService();
        await service.fetchClientInfo();
        await ctx.edit(ctx.format.info("Cari server terbaik..."), speedtestMsg.key);
        const bestServer = await service.findBestServer();
        await ctx.edit(ctx.format.info("Uji latency..."), speedtestMsg.key);
        const latencySpeed = (await service.testLatency(bestServer, 5)).latency;
        await ctx.edit(ctx.format.info("Uji download..."), speedtestMsg.key);
        const downloadSpeed = await service.testDownload(bestServer, null, {
            threads: 4,
            duration: 10000
        });
        await ctx.edit(ctx.format.info("Uji upload..."), speedtestMsg.key);
        const uploadSpeed = await service.testUpload(bestServer, null, {
            duration: 10000
        });
        await ctx.edit(
            `❖ ${ctx.format.bold("Latency")}: ${ctx.format.convertMsToDuration(latencySpeed)}\n` +
            `❖ ${ctx.format.bold("Download")}: ${ctx.format.formatSize(downloadSpeed, true)}\n` +
            `❖ ${ctx.format.bold("Upload")}: ${ctx.format.formatSize(uploadSpeed, true)}`,
            speedtestMsg.key
        );
    }
};
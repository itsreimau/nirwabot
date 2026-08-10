const { SpeedTestService } = require("@ginkohub/speedtest-js");

module.exports = {
    name: "speedtest",
    aliases: ["speed"],
    category: "information",
    code: async (ctx) => {
        const speedtestMsg = await ctx.reply(ctx.format.info("Memulai speedtest..."));
        await ctx.editMessage(ctx.id, speedtestMsg.key, ctx.format.info("Mengambil informasi client..."));
        const service = new SpeedTestService();
        await service.fetchClientInfo();

        await ctx.editMessage(ctx.id, speedtestMsg.key, ctx.format.info("Mencari server terbaik..."));
        const bestServer = await service.findBestServer();

        await ctx.editMessage(ctx.id, speedtestMsg.key, ctx.format.info("Menguji latency..."));
        const latencySpeed = (await service.testLatency(bestServer, 5)).latency;

        await ctx.editMessage(ctx.id, speedtestMsg.key, ctx.format.info("Menguji kecepatan download..."));
        const downloadSpeed = await service.testDownload(bestServer, null, {
            threads: 4,
            duration: 10000
        });

        await ctx.editMessage(ctx.id, speedtestMsg.key, ctx.format.info("Menguji kecepatan upload..."));
        const uploadSpeed = await service.testUpload(bestServer, null, {
            duration: 10000
        });

        await ctx.editMessage(ctx.id, speedtestMsg.key,
            `❖ ${ctx.format.bold("Latency")}: ${ctx.format.convertMsToDuration(latencySpeed)}\n` +
            `❖ ${ctx.format.bold("Download")}: ${ctx.format.formatSize(downloadSpeed, true)}\n` +
            `❖ ${ctx.format.bold("Upload")}: ${ctx.format.formatSize(uploadSpeed, true)}`
        );
    }
};
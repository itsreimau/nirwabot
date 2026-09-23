const { SpeedTestService } = require("@ginkohub/speedtest-js");

module.exports = {
    name: "ping",
    aliases: ["p"],
    category: "information",
    code: async (ctx) => {
        const pongMsg = await ctx.reply(ctx.format.info("Pong!"));
        const service = new SpeedTestService();
        await service.fetchClientInfo();
        const bestServer = await service.findBestServer();
        const latencySpeed = (await service.testLatency(bestServer, 5)).latency;
        await ctx.edit(ctx.format.info(`Pong! ${ctx.format.convertMsToDuration(latencySpeed)}`, pongMsg.key));
    }
};
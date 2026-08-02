module.exports = {
    name: "ping",
    aliases: ["p"],
    category: "information",
    code: async (ctx) => {
        const startTime = performance.now();
        const pongMsg = await ctx.reply(ctx.format.info("Pong!"));
        const responseTime = performance.now() - startTime;
        await ctx.editMessage(ctx.id, pongMsg.key, ctx.format.info(`Pong! Merespon dalam ${ctx.format.convertMsToDuration(responseTime)}.`));
    }
};
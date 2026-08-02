module.exports = {
    name: "bypassshortlink",
    aliases: ["bypasslink"],
    category: "tool",
    permissions: {
        premium: true
    },
    code: async (ctx) => {
        const url = ctx.args[0] || ctx.helper.extractUrlFromText(ctx.quoted?.body);
        if (!url)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "https://itsreimau.is-a.dev")
            );
        if (!ctx.helper.isUrl(url)) return await ctx.reply(ctx.format.info(config.msg.invalidUrl));
        try {
            const apiUrl = ctx.api.createUrl("alwayscodex", "/api/solve/bypasslink", {
                url
            });
            const result = (await ctx.request.get(apiUrl)).data.result.bypassedUrl;
            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
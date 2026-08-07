module.exports = {
    name: "screenshot",
    aliases: ["ss", "sshp", "sspc", "sstab", "ssweb"],
    category: "tool",
    permissions: {
        coin: 10
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
            const deviceMap = {
                sshp: "mobile",
                sstab: "tablet"
            };
            const device = deviceMap[ctx.used] || "desktop";
            const result = ctx.api.createUrl("alwayscodex", "/api/tools/ssweb", {
                url,
                device
            });
            await ctx.reply({
                image: {
                    url: result
                },
                caption: `❖ ${ctx.format.bold("URL")}: ${url}`
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
module.exports = {
    name: "translate",
    aliases: ["tr"],
    category: "tool",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        const langRegex = /^[a-z]{2}(-[a-zA-Z]{2,4})?$/;
        const hasLang = langRegex.test(ctx.args[0]);
        const langCode = hasLang ? ctx.args[0] : "en";
        const input = ctx.args.slice(hasLang ? 1 : 0).join(" ") || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "en halo, dunia!")}\n` +
                ctx.format.generateNotes([
                    "Kode bahasa, contoh: id, en, ja, ko, ar, zh-cn"
                ])
            );

        try {
            const apiUrl = ctx.api.createUrl("kangwifi", "/tools/translate", {
                text: input,
                to: langCode
            });
            const result = (await ctx.request.get(apiUrl)).data.result;
            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
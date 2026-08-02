module.exports = {
    name: "translate",
    aliases: ["tr"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const langCode = ctx.args[0]?.length === 2 ? ctx.args[0] : "en";
        let input = ctx.args.slice(ctx.args[0]?.length === 2 ? 1 : 0).join(" ");
        if (!input && ctx.quoted?.body) input = ctx.quoted.body;

        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "en halo, dunia!")}\n` +
                ctx.format.generateNotes([
                    "Gunakan kode bahasa 2 huruf, periksa daftar lengkapnya di Google. (contoh: en, id, ja, ar)"
                ])
            );

        try {
            const apiUrl = ctx.api.createUrl("nexray", "/tools/translate", {
                text: input,
                lang: langCode
            });
            const result = (await ctx.request.get(apiUrl)).data.result.translated_text;
            await ctx.reply(result);
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
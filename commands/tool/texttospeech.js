module.exports = {
    name: "texttospeech",
    aliases: ["tts"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const langRegex = /^[a-z]{2}(-[a-zA-Z]{2,4})?$/;
        let langCode = "id";
        if (langRegex.test(ctx.args[0])) langCode = ctx.args[0];
        let input = ctx.args.slice(langRegex.test(ctx.args[0]) ? 1 : 0).join(" ");
        if (!input && ctx.quoted?.body) input = ctx.quoted.body;

        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "id halo, dunia!")}\n` +
                ctx.format.generateNotes([
                    "Gunakan kode bahasa 2 huruf, periksa daftar lengkapnya di Google. (contoh: id, en, ja, ko, ar, zh-cn)"
                ])
            );

        try {
            const apiUrl = ctx.api.createUrl("kangwifi", "/tools/tts", {
                text: input,
                to: langCode
            });
            const result = (await ctx.request.get(apiUrl)).data.url;
            await ctx.reply({
                audio: {
                    url: result
                }
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
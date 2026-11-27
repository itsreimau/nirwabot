module.exports = {
    name: "texttospeech",
    aliases: ["tts"],
    category: "tool",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        const langCode = ctx.args[0]?.length === 2 ? ctx.args[0] : "id";
        let input = ctx.args.slice(ctx.args[0]?.length === 2 ? 1 : 0).join(" ");
        if (!input && ctx.quoted?.body) input = ctx.quoted.body;

        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "id halo, dunia!")}\n` +
                ctx.format.generateNotes([
                    "Gunakan kode bahasa 2 huruf. (contoh: en, id, ja, ar, ko)"
                ])
            );

        try {
            const apiUrl = ctx.api.createUrl("nexray", "/ai/gemini-tts", {
                text: input,
                lang: langCode
            });
            const result = (await ctx.request.get(apiUrl)).data.result;

            await ctx.reply({
                audio: {
                    url: result
                },
                mimetype: "audio/mpeg"
            });
        } catch (error) {
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
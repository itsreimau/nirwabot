module.exports = {
    name: "alkitab",
    aliases: ["bible"],
    category: "tool",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const [passage, number] = ctx.args;
        if (!passage && !number)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "kej 2:18")}\n` +
                ctx.format.generateNotes([
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`
                ])
            );

        if (passage.toLowerCase() === "list") {
            const listText = await ctx.list.get(ctx, "alkitab");
            return await ctx.reply(listText);
        }

        try {
            const apiUrl = ctx.api.createUrl("https://api-alkitab.vercel.app", "/api/passage", {
                passage,
                num: number
            });
            const result = (await ctx.request.get(apiUrl)).data.bible.book;
            const resultText = result.chapter.verses.map(vers =>
                `❖ ${ctx.format.bold("Ayat")}: ${vers.number}\n` +
                vers.text
            ).join("\n");
            await ctx.reply(
                `${resultText}\n` +
                "\n" +
                `❖ ${ctx.format.bold("Nama")}: ${result.name}\n` +
                `❖ ${ctx.format.bold("Bab")}: ${result.chapter.chap}`
            );
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
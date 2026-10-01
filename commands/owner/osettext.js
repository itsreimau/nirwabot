const validKeys = ["donate", "price", "qris"];

module.exports = {
    name: "osettext",
    aliases: ["osettxt"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const key = ctx.args[0];
        const text = ctx.text?.startsWith(`${key} `) ? ctx.text.slice(key.length + 1) : ctx.quoted?.body;
        if (key?.toLowerCase() === "list") return await ctx.reply(await ctx.list.get(ctx, "osettext"));
        if (!key || !text)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, ctx.helper.getRandomElement(["price $1 untuk sewa bot 1 bulan", "price delete"]))}\n` +
                ctx.format.generateNotes([
                    `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} untuk daftar`,
                    `Gunakan ${ctx.format.inlineCode("delete")} untuk hapus`
                ])
            );

        try {
            const setKey = key.toLowerCase();
            if (!validKeys.includes(setKey)) return await ctx.reply(ctx.format.info(`Teks ${ctx.format.inlineCode(key)} tidak valid.`));
            const botDb = ctx.db.bot;
            if (text.toLowerCase() === "delete") {
                delete botDb.text[setKey];
                botDb.save();
                return await ctx.reply(ctx.format.info(`Teks ${ctx.format.inlineCode(key)} dihapus.`));
            }
            botDb.text[setKey] = text;
            botDb.save();
            await ctx.reply(ctx.format.info(`Teks ${ctx.format.inlineCode(key)} disimpan.`));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
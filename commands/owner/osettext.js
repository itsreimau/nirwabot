module.exports = {
    name: "osettext",
    aliases: ["osettxt"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const key = ctx.args[0];
        const text = ctx.text.startsWith(`${key} `) ? ctx.text.slice(key.length + 1) : ctx.quoted?.body;

        if (key?.toLowerCase() === "list") {
            const listText = await ctx.list.get(ctx, "osettext");
            return await ctx.reply(listText);
        }

        if (!key || !text)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "price $1 untuk sewa bot 1 bulan")}\n` +
                ctx.format.generateNotes([
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`,
                    `Gunakan ${ctx.format.inlineCode("delete")} sebagai teks untuk menghapus teks yang disimpan sebelumnya.`
                ])
            );

        try {
            const validKeys = [
                "donate",
                "price",
                "qris"
            ];
            const setKey = key.toLowerCase();
            if (!validKeys.includes(setKey)) return await ctx.reply(ctx.format.info(`Teks ${ctx.format.inlineCode(key)} tidak valid!`));

            const botDb = ctx.db.bot;
            if (text.toLowerCase() === "delete") {
                delete botDb?.text?.[setKey];
                botDb.save();
                return await ctx.reply(ctx.format.info(`Pesan untuk teks ${ctx.format.inlineCode(key)} berhasil dihapus!`));
            }
            (botDb.text ||= {})[setKey] = text;
            botDb.save();
            await ctx.reply(ctx.format.info(`Pesan untuk teks ${ctx.format.inlineCode(key)} berhasil disimpan!`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
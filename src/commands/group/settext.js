const validKeys = ["goodbye", "intro", "welcome"];

module.exports = {
    name: "settext",
    aliases: ["settxt"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const key = ctx.args[0];
        const text = ctx.text?.startsWith(`${key} `) ? ctx.text.slice(key.length + 1) : ctx.quoted?.body;
        if (key?.toLowerCase() === "list") return await ctx.reply(await ctx.list.get(ctx, "settext"));
        if (!key || !text)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, ctx.helper.getRandomElement(["welcome Selamat datang di grup!", "welcome delete"]))}\n` +
                ctx.format.generateNotes([
                    `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} untuk daftar`,
                    `Gunakan: ${ctx.format.inlineCode("delete")} untuk hapus`
                ])
            );

        try {
            const setKey = key.toLowerCase();
            if (!validKeys.includes(setKey)) return await ctx.reply(ctx.format.info(`Teks ${ctx.format.inlineCode(key)} tidak valid.`));
            const groupDb = ctx.db.group;
            if (text.toLowerCase() === "delete") {
                delete groupDb.text[setKey];
                groupDb.save();
                return await ctx.reply(ctx.format.info(`Teks ${ctx.format.inlineCode(key)} dihapus.`));
            }
            groupDb.text[setKey] = text;
            groupDb.save();
            await ctx.reply(ctx.format.info(`Teks ${ctx.format.inlineCode(key)} disimpan.`));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
const validOptions = ["antiaudio", "antidocument", "antiimage", "antisticker", "antivideo", "antigcsw", "antilink", "antispam", "antitagsw", "antitoxic", "autokick", "gamerestrict", "welcome"];

module.exports = {
    name: "setoption",
    aliases: ["setopt"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "antilink")}\n` +
                ctx.format.generateNotes([
                    `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} untuk daftar`,
                    `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} status`)} untuk status`
                ])
            );
        if (input.toLowerCase() === "list") return await ctx.reply(await ctx.list.get(ctx, "setoption"));
        if (input.toLowerCase() === "status") {
            const groupOption = ctx.db.group.option;
            const text = validOptions.map(opt => `❖ ${ctx.format.ucwords(opt)}: ${groupOption[opt] ? "Aktif" : "Nonaktif"}`).join("\n");
            return await ctx.reply(text);
        }

        try {
            const setKey = input.toLowerCase();
            if (!validOptions.includes(setKey)) return await ctx.reply(ctx.format.info(`Opsi ${ctx.format.inlineCode(input)} tidak valid.`));
            const groupDb = ctx.db.group;
            const newStatus = !groupDb.option[setKey];
            groupDb.option[setKey] = newStatus;
            groupDb.save();
            await ctx.reply(ctx.format.info(`Opsi ${ctx.format.inlineCode(input)} ${newStatus ? "diaktifkan" : "dinonaktifkan"}.`));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
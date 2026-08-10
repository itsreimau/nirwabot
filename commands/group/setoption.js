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
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`,
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} status`)} untuk melihat status.`
                ])
            );

        if (input.toLowerCase() === "list") {
            const listText = await ctx.list.get(ctx, "setoption");
            return await ctx.reply(listText);
        }

        if (input.toLowerCase() === "status") {
            const groupOption = ctx.db.group.option || {};
            const statuses = [
                "antiaudio",
                "antidocument",
                "antiimage",
                "antisticker",
                "antivideo",
                "antigcsw",
                "antilink",
                "antispam",
                "antitagsw",
                "antitoxic",
                "autokick",
                "gamerestrict",
                "welcome"
            ];
            const text = statuses.map(key => `❖ ${ctx.format.ucwords(key)}: ${groupOption[key] ? "Aktif" : "Nonaktif"}`).join("\n");
            return await ctx.reply(text);
        }

        try {
            const validOptions = [
                "antiaudio",
                "antidocument",
                "antiimage",
                "antisticker",
                "antivideo",
                "antigcsw",
                "antilink",
                "antispam",
                "antitagsw",
                "antitoxic",
                "autokick",
                "gamerestrict",
                "welcome"
            ];
            const setKey = input.toLowerCase();
            if (!validOptions.includes(setKey)) return await ctx.reply(ctx.format.info(`Opsi ${ctx.format.inlineCode(input)} tidak valid!`));

            const groupDb = ctx.db.group;
            const currentStatus = groupDb?.option?.[setKey] || false;
            const newStatus = !currentStatus;
            (groupDb.option ||= {})[setKey] = newStatus;
            groupDb.save();
            await ctx.reply(ctx.format.info(`Opsi ${ctx.format.inlineCode(input)} berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}!`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
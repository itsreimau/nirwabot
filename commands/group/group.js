module.exports = {
    name: "group",
    aliases: ["g"],
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
                `${ctx.format.generateCmdExample(ctx.used, "open")}\n` +
                ctx.format.generateNotes([
                    `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} untuk daftar`
                ])
            );
        if (input.toLowerCase() === "list") return await ctx.reply(await ctx.list.get(ctx, "group"));

        try {
            const actionMap = {
                open: () => ctx.group().open(),
                close: () => ctx.group().close(),
                lock: () => ctx.group().lock(),
                unlock: () => ctx.group().unlock(),
                approve: () => ctx.group().joinApproval("on"),
                disapprove: () => ctx.group().joinApproval("off"),
                invite: () => ctx.group().membersCanAddMemberMode("on"),
                restrict: () => ctx.group().membersCanAddMemberMode("off")
            };
            const action = actionMap[input.toLowerCase()];
            if (!action) return await ctx.reply(ctx.format.info(`Setelan "${input}" tidak valid.`));
            await action();
            await ctx.reply(ctx.format.info("Setelan grup diubah."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
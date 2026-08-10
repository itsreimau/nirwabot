module.exports = {
    name: "group",
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
                    `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} untuk melihat daftar.`
                ])
            );

        if (input.toLowerCase() === "list") {
            const listText = await ctx.list.get(ctx, "group");
            return await ctx.reply(listText);
        }

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
            if (!action) return await ctx.reply(ctx.format.info(`Setelan "${input}" tidak valid!`));
            await action();
            await ctx.reply(ctx.format.info("Berhasil mengubah setelan grup!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
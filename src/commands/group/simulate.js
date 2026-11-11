const { WelcomeHandler } = require("../../events/welcome");

module.exports = {
    name: "simulate",
    aliases: ["sim"],
    category: "group",
    permissions: {
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                `${ctx.format.generateCmdExample(ctx.used, "join")}\n` +
                ctx.format.generateNotes([
                    `Gunakan: ${ctx.format.inlineCode("leave")} untuk simulasi keluar`
                ])
            );

        try {
            const welcome = {
                id: ctx.id,
                participant: {
                    id: ctx.sender.jid,
                    phoneNumber: ctx.sender.phoneNumber
                }
            };
            const actionMap = {
                j: "UserJoin",
                join: "UserJoin",
                l: "UserLeave",
                leave: "UserLeave"
            };
            const action = actionMap[input.toLowerCase()];
            if (!action) return await ctx.reply(ctx.format.info(`Simulasi ${ctx.format.inlineCode(input)} tidak valid.`));
            await WelcomeHandler(ctx, welcome, action, true);
            await ctx.reply(ctx.format.info("Simulasi berhasil."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
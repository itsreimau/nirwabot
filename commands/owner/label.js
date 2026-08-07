module.exports = {
    name: "label",
    aliases: ["tag"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const input = ctx.text;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "bot wangsaf")
            );
        if (input.length > 30) return await ctx.reply(ctx.format.info("Maksimal 30 karakter!"));

        try {
            const waitMsg = await ctx.reply(ctx.format.info(config.msg.wait));
            const groupJids = Object.values(await ctx.core.groupFetchAllParticipating()).filter(g => !g.announce && !g.isCommunity && !g.isCommunityAnnounce).map(g => g.id);
            const {
                delays
            } = ctx.helper.calculateDelays(groupJids.length);
            for (let i = 0; i < groupJids.length; i++) {
                try {
                    await ctx.core.updateMemberLabel(groupJids[i], input);
                    await ctx.helper.delay(delays[i]);
                } catch {}
            }
            await ctx.editMessage(ctx.id, waitMsg.key, ctx.format.info(`Label bot berhasil diubah menjadi ${ctx.format.inlineCode(input)} di ${groupJids.length} grup!`));
        } catch (error) {
            await ctx.helper.handleError(ctx, error, false);
        }
    }
};
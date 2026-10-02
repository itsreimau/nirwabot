module.exports = {
    name: "groupstatus",
    aliases: ["gcsw", "swgc", "upgcsw", "upswgc"],
    category: "group",
    permissions: {
        admin: true,
        group: true
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        const type = ctx.isMedia(["image", "video"]);
        if (!input && !type)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "halo, dunia!")
            );

        try {
            const content = type ? {
                [type]: await ctx.msg.media.download() || await ctx.quoted.msg.media.download(),
                caption: input
            } : {
                text: input
            };
            await ctx.reply({
                ...content,
                statusAudience: {
                    listName: ctx.sender.pushName,
                    listEmoji: "🏷️"
                },
                groupStatus: true
            });
            await ctx.reply(ctx.format.info("Group status terkirim."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error, false);
        }
    }
};
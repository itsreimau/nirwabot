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
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "halo, dunia!")
            );

        try {
            let content;
            const type = ctx.isMedia(["image", "video"]);
            if (["image", "video"].includes(type)) {
                const buffer = await ctx.msg.download() || await ctx.quoted.download();
                content = {
                    [type]: buffer,
                    caption: input
                };
            } else {
                content = {
                    text: input
                };
            }
            await ctx.reply({
                ...content,
                groupStatus: true
            });
            await ctx.reply(ctx.format.info("Group status berhasil dikirim!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error, false);
        }
    }
};
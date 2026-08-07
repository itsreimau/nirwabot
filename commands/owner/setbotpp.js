module.exports = {
    name: "setbotpp",
    aliases: ["setboticon", "seticonbot", "setppbot"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const type = ctx.isMedia(["image"]);
        if (!type) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));
        try {
            const buffer = await ctx.msg.download() || await ctx.quoted.download();
            const image = type ? ctx.msg.message.imageMessage : ctx.quoted.message.imageMessage;
            const dimensions = ctx.helper.calculateDimensions(image.width, image.height);
            await ctx.core.updateProfilePicture(ctx.me.id, buffer, dimensions);
            await ctx.reply(ctx.format.info("Berhasil mengubah gambar profil bot!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
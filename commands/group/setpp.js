module.exports = {
    name: "setpp",
    aliases: ["seticon"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const type = ctx.isMedia(["image"]);
        if (!type) return await ctx.reply(ctx.format.generateInstruction(["send", "reply"], ["image"]));

        try {
            const buffer = await ctx.msg.download() || await ctx.quoted.download();
            const image = type ? ctx.msg.message.imageMessage : ctx.quoted.message.imageMessage;
            const dimensions = ctx.helper.calculateDimensions(image.width, image.height);
            await ctx.group().updateProfilePicture(buffer, dimensions);
            await ctx.reply(ctx.format.info("Berhasil mengubah gambar profil grup!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
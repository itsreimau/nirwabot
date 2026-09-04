const moment = require("moment-timezone");

module.exports = {
    name: "quotlychat",
    aliases: ["qc", "quotly"],
    category: "maker",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const input = ctx.text || ctx.quoted?.body;
        if (!input)
            return await ctx.reply(
                `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                ctx.format.generateCmdExample(ctx.used, "get in the fucking robot, shinji!")
            );
        if (input.length > 1000) return await ctx.reply(ctx.format.info("Maksimal 1000 karakter!"));
        try {
            const isQuoted = !ctx.text && ctx.quoted;
            const profilePictureUrl = await ctx.core.profilePictureUrl(isQuoted ? ctx.quoted?.sender : ctx.sender.lid).catch(() => "https://placehold.net/avatar.png");
            const result = (await ctx.request.post("https://qwa.eeq.my.id/api/generate", {
                sender_name: isQuoted ? ctx.quoted?.pushName : ctx.sender.pushName,
                sender_number: ctx.getId(ctx.sender.jid),
                sender_avatar: profilePictureUrl,
                message: input,
                time: moment.tz(config.system.timeZone).format("HH:mm")
            }, {
                responseType: "arraybuffer"
            })).data;
            await ctx.reply({
                sticker: result
            }, {
                pack: config.sticker.packname,
                author: config.sticker.author
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
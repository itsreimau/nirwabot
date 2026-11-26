const crypto = require("node:crypto");

module.exports = {
    name: "stickeraudio",
    aliases: ["saudio", "saud", "stickeraud"],
    category: "converter",
    permissions: {
        ticket: true
    },
    code: async (ctx) => {
        const senderDb = ctx.db.user;
        senderDb.stickerAudio ||= [];
        const id = ctx.args[0]?.trim();
        const findItem = (key) => senderDb.stickerAudio.find(sticker => sticker.id === key);
        const removeItem = (key) => {
            senderDb.stickerAudio = senderDb.stickerAudio.filter(sticker => sticker.id !== key);
            senderDb.save();
        };

        if (id) {
            if (!ctx.isMedia(["audio"], ["quoted"]))
                return ctx.reply(
                    `${ctx.format.generateInstruction(["reply"], ["audio"])}\n` +
                    ctx.format.generateCmdExample(ctx.used, id)
                );
            const item = findItem(id);
            if (!item) return ctx.reply(ctx.format.info(`ID ${ctx.format.inlineCode(id)} tidak ditemukan.`));

            await ctx.core.sendStAudioMessage(ctx.id, {
                image: Buffer.from(item.base64, "base64"),
                audio: await ctx.quoted.msg.media.download(),
                audioOptions: {
                    mimetype: "audio/m4a"
                }
            }, {
                quoted: ctx.msg
            });
            removeItem(id);
            return;
        }

        if (ctx.isMedia(["sticker"], ["quoted"])) {
            const buffer = await ctx.quoted.msg.media.download();
            let newId;
            do newId = crypto.randomBytes(3).toString("hex");
            while (findItem(newId));
            senderDb.stickerAudio.push({
                id: newId,
                base64: buffer.toString("base64"),
                createdAt: Date.now()
            });
            senderDb.save();
            return ctx.reply({
                text: ctx.format.info("Stiker disimpan."),
                nativeFlow: [{
                    text: "Salin Perintah",
                    copy: `${ctx.used.prefix + ctx.used.command} ${newId}`
                }]
            });
        }

        return ctx.reply(
            `${ctx.format.generateInstruction(["reply"], ["audio", "sticker"])}\n` +
            ctx.format.generateNotes([
                `Balas stiker dengan ${ctx.format.inlineCode(ctx.used.prefix + ctx.used.command)} untuk dapat ID.`,
                `Balas audio dengan ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} <id>`)} untuk gabung.`
            ])
        );
    }
};
module.exports = [{
    name: "mute",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        if (ctx.args[0]?.toLowerCase() === "bot") {
            const groupDb = ctx.db.group;
            groupDb.mutebot = true;
            await groupDb.save();
            return await ctx.reply(ctx.format.info("Berhasil me-mute grup ini dari bot!"));
        }

        const target = await ctx.target(["quoted", "mentioned"]);
        const daysAmount = parseInt(ctx.args[target.source === "quoted" ? 0 : 1], 10);
        if (!target.jid)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "@6281234567891 8")}\n` +
                    ctx.format.generateNotes([
                        "Balas/quote pesan untuk menjadikan pengirim sebagai akun target.",
                        `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-mute bot.`
                    ]),
                mentions: ["6281234567891@s.whatsapp.net"]
            });

        if (daysAmount && daysAmount <= 0) return await ctx.reply(ctx.format.info("Durasi mute (dalam hari) harus lebih dari 0!"));
        if (ctx.helper.areJidsSameUser(target.jid, ctx.me.lid)) return await ctx.reply(ctx.format.info(`Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-mute bot.`));
        if (await ctx.group().isOwner(target.jid)) return await ctx.reply(ctx.format.info("Dia adalah owner grup!"));

        try {
            const groupDb = ctx.db.group;
            const muteList = groupDb?.mute || [];
            if (muteList.find(m => m.jid === target.jid)) return await ctx.reply(ctx.format.info("Pengguna sudah di-mute sebelumnya!"));

            if (daysAmount && daysAmount > 0) {
                muteList.push({
                    jid: target.jid,
                    expiration: Date.now() + (daysAmount * 24 * 60 * 60 * 1000)
                });
                groupDb.mute = muteList;
                await groupDb.save();
                await ctx.reply(ctx.format.info(`Berhasil me-mute pengguna itu selama ${daysAmount} hari!`));
            } else {
                muteList.push({
                    jid: target.jid,
                    expiration: null
                });
                groupDb.mute = muteList;
                await groupDb.save();
                await ctx.reply(ctx.format.info("Berhasil me-mute pengguna itu!"));
            }
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}, {
    name: "unmute",
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        if (ctx.args[0]?.toLowerCase() === "bot") {
            const groupDb = ctx.db.group;
            groupDb.mutebot = false;
            await groupDb.save();
            return await ctx.reply(ctx.format.info("Berhasil me-unmute grup ini dari bot!"));
        }

        const target = await ctx.target(["quoted", "mentioned"]);
        if (!target.jid)
            return await ctx.reply({
                text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
                    `${ctx.format.generateCmdExample(ctx.used, "@6281234567891")}\n` +
                    ctx.format.generateNotes([
                        "Balas/quote pesan untuk menjadikan pengirim sebagai akun target.",
                        `Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-unmute bot.`
                    ]),
                mentions: ["6281234567891@s.whatsapp.net"]
            });

        if (ctx.helper.areJidsSameUser(target.jid, ctx.me.lid)) return await ctx.reply(ctx.format.info(`Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk me-unmute bot.`));
        if (await ctx.group().isOwner(target.jid)) return await ctx.reply(ctx.format.info("Dia adalah owner grup!"));

        try {
            const groupDb = ctx.db.group;
            const muteList = groupDb?.mute || [];
            const index = muteList.findIndex(m => m.jid === target.jid);
            if (index === -1) return await ctx.reply(ctx.format.info("Pengguna tidak ditemukan dalam daftar mute!"));
            muteList.splice(index, 1);
            groupDb.mute = muteList;
            await groupDb.save();
            await ctx.reply(ctx.format.info("Berhasil me-unmute pengguna itu dari grup ini!"));
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
}];
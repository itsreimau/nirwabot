const buildUsage = async (ctx, example, notesAction) =>
    await ctx.reply({
        text: `${ctx.format.generateInstruction(["send"], ["text"])}\n` +
            `${ctx.format.generateCmdExample(ctx.used, example)}\n` +
            ctx.format.generateNotes([
                "Balas/quote pesan target.",
                `Ketik: ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk ${notesAction} bot`
            ]),
        mentions: ["6281234567891@s.whatsapp.net"]
    });

module.exports = [{
    name: "mute",
    aliases: ["bungkam"],
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
            return await ctx.reply(ctx.format.info("Bot di-mute di grup ini."));
        }
        const target = await ctx.target(["quoted", "mentioned"]);
        const daysAmount = Number(ctx.args[target.source === "quoted" ? 0 : 1]);
        if (!target.id) return await buildUsage(ctx, "@6281234567891 8", "mute");
        if (daysAmount && daysAmount <= 0) return await ctx.reply(ctx.format.info("Durasi mute harus > 0 hari."));
        if (ctx.helper.areJidsSameUser(target.id, ctx.me.lid)) return await ctx.reply(ctx.format.info(`Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk mute bot.`));
        if (await ctx.group().isOwner(target.id)) return await ctx.reply(ctx.format.info("Dia owner grup."));

        try {
            const groupDb = ctx.db.group;
            const muteList = groupDb.mute;
            if (muteList.find(mute => mute.id === target.id)) return await ctx.reply(ctx.format.info("Sudah di-mute."));
            muteList.push({
                id: target.id,
                expiration: daysAmount > 0 ? Date.now() + daysAmount * 24 * 60 * 60 * 1000 : null
            });
            groupDb.mute = muteList;
            await groupDb.save();
            await ctx.reply(ctx.format.info(daysAmount > 0 ? `Di-mute ${daysAmount} hari.` : "Di-mute permanen."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
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
            return await ctx.reply(ctx.format.info("Bot di-unmute di grup ini."));
        }
        const target = await ctx.target(["quoted", "mentioned"]);
        if (!target.id) return await buildUsage(ctx, "@6281234567891", "unmute");
        if (ctx.helper.areJidsSameUser(target.id, ctx.me.lid)) return await ctx.reply(ctx.format.info(`Ketik ${ctx.format.inlineCode(`${ctx.used.prefix + ctx.used.command} bot`)} untuk unmute bot.`));
        if (await ctx.group().isOwner(target.id)) return await ctx.reply(ctx.format.info("Dia owner grup."));

        try {
            const groupDb = ctx.db.group;
            const muteList = groupDb.mute;
            const index = muteList.findIndex(mute => mute.id === target.id);
            if (index === -1) return await ctx.reply(ctx.format.info("Tidak ada di daftar mute."));
            muteList.splice(index, 1);
            groupDb.mute = muteList;
            await groupDb.save();
            await ctx.reply(ctx.format.info("Di-unmute."));
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
}];
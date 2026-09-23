const sessions = new Map();

module.exports = {
    name: "family100",
    category: "game",
    permissions: {
        group: true
    },
    code: async (ctx) => {
        if (sessions.has(ctx.id)) return await ctx.reply(ctx.format.info("Sesi sedang berjalan."));

        try {
            const apiUrl = ctx.api.createUrl("siputzx", "/api/games/family100");
            const result = (await ctx.request.get(apiUrl)).data.data;
            const game = {
                timeout: 90000,
                answers: new Set(result.jawaban.map(ans => ans.toLowerCase())),
                participants: new Set()
            };

            await ctx.reply({
                text: `✦ — ${result.soal}\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Jumlah jawaban")}: ${game.answers.size}\n` +
                    `❖ ${ctx.format.bold("Waktu")}: ${ctx.format.convertMsToDuration(game.timeout)}`,
                buttons: [{
                    text: "Menyerah",
                    id: `surrender_${ctx.used.command}`
                }]
            });

            const collector = ctx.MessageCollector({
                time: game.timeout
            });
            sessions.set(ctx.id, true);
            setTimeout(() => {
                if (sessions.has(ctx.id)) {
                    sessions.delete(ctx.id);
                    collector.stop();
                }
            }, game.timeout + 5000);
            const playAgain = [{
                text: "Main Lagi",
                id: ctx.used.prefix + ctx.used.command
            }];

            collector.on("collect", async (collCtx) => {
                const participantAnswer = collCtx.msg.body?.toLowerCase();
                const participantDb = collCtx.db.user;

                if (game.answers.has(participantAnswer)) {
                    game.answers.delete(participantAnswer);
                    game.participants.add(collCtx.sender.jid);
                    participantDb.score += 1;
                    participantDb.save();
                    await collCtx.reply(ctx.format.info(`${ctx.format.ucwords(participantAnswer)} benar! +1 skor. Sisa: ${game.answers.size}`));

                    if (game.answers.size === 0) {
                        sessions.delete(ctx.id);
                        collector.stop();
                        for (const participant of game.participants) {
                            const allParticipantDb = ctx.getDb("users", participant);
                            allParticipantDb.score += 3;
                            allParticipantDb.save();
                        }
                        await collCtx.reply({
                            text: ctx.format.info("Semua terjawab! +3 skor per penjawab."),
                            buttons: playAgain
                        });
                    }
                } else if (participantAnswer === `surrender_${ctx.used.command}`) {
                    const remaining = [...game.answers].map(ctx.format.ucwords).join(", ").replace(/, ([^,]*)$/, ", dan $1");
                    sessions.delete(ctx.id);
                    collector.stop();
                    await collCtx.reply({
                        text: ctx.format.info(`Menyerah! Belum terjawab: ${remaining}`),
                        buttons: playAgain
                    });
                }
            });

            collector.on("end", async () => {
                const remaining = [...game.answers].map(ctx.format.ucwords).join(", ").replace(/, ([^,]*)$/, ", dan $1");
                if (sessions.has(ctx.id)) {
                    sessions.delete(ctx.id);
                    await ctx.reply({
                        text: ctx.format.info(`Waktu habis! Belum terjawab: ${remaining}`),
                        buttons: playAgain
                    });
                }
            });
        } catch (error) {
            sessions.delete(ctx.id);
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
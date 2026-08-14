const sessions = new Map();

module.exports = {
    name: "family100",
    category: "game",
    permissions: {
        group: true
    },
    code: async (ctx) => {
        if (sessions.has(ctx.id)) return await ctx.reply(ctx.format.info("Sesi permainan sedang berjalan!"));

        try {
            const apiUrl = ctx.api.createUrl("siputzx", "/api/games/family100");
            const result = (await ctx.request.get(apiUrl)).data.data;
            const game = {
                coin: {
                    answered: 5,
                    allAnswered: 10
                },
                timeout: 90000,
                answers: new Set(result.jawaban.map(ans => ans.toLowerCase())),
                participants: new Set()
            };

            sessions.set(ctx.id, true);

            await ctx.reply({
                text: `✦ — ${result.soal}\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Bonus")}: ${game.coin.answered} koin untuk 1 jawaban benar, ${game.coin.allAnswered} koin untuk semua jawaban benar\n` +
                    `❖ ${ctx.format.bold("Jumlah jawaban")}: ${game.answers.size}\n` +
                    `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(game.timeout)}`,
                buttons: [{
                    text: "Menyerah",
                    id: `surrender_${ctx.used.command}`
                }]
            });

            const collector = ctx.MessageCollector({
                time: game.timeout
            });
            const playAgain = [{
                text: "Main Lagi",
                id: ctx.used.prefix + ctx.used.command
            }];

            collector.on("collect", async (collCtx) => {
                const participantAnswer = collCtx.msg.body?.toLowerCase();
                const participantDb = collCtx.db.user;
                const isUnlimited = collCtx.sender.isOwner() || participantDb?.premium;

                if (game.answers.has(participantAnswer)) {
                    game.answers.delete(participantAnswer);
                    game.participants.add(collCtx.sender.lid);
                    if (!isUnlimited) {
                        participantDb.coin += game.coin.answered;
                        participantDb.save();
                    }
                    await collCtx.reply(ctx.format.info(`${ctx.format.ucwords(participantAnswer)} benar! Jawaban tersisa: ${game.answers.size}`));

                    if (game.answers.size === 0) {
                        sessions.delete(ctx.id);
                        collector.stop();
                        for (const participant of game.participants) {
                            const allParticipantDb = ctx.getDb("users", participant);
                            const isAllUnlimited = collCtx.checkOwner(participant) || allParticipantDb?.premium;
                            if (!isAllUnlimited) allParticipantDb.coin += game.coin.allAnswered;
                            allParticipantDb.winGame += 1;
                            allParticipantDb.save();
                        }
                        await collCtx.reply({
                            text: ctx.format.info(`Selamat, semua jawaban telah terjawab! Setiap anggota yang menjawab +${game.coin.allAnswered} koin.`),
                            buttons: playAgain
                        });
                    }
                } else if (participantAnswer === `surrender_${ctx.used.command}`) {
                    const remaining = [...game.answers].map(ctx.format.ucwords).join(", ").replace(/, ([^,]*)$/, ", dan $1");
                    sessions.delete(ctx.id);
                    collector.stop();
                    await collCtx.reply({
                        text: ctx.format.info(`Anda menyerah! Jawaban yang belum terjawab: ${remaining}`),
                        buttons: playAgain
                    });
                }
            });

            collector.on("end", async (reason) => {
                const remaining = [...game.answers].map(ctx.format.ucwords).join(", ").replace(/, ([^,]*)$/, ", dan $1");
                if (reason === "timeout" && sessions.has(ctx.id)) {
                    sessions.delete(ctx.id);
                    await ctx.reply({
                        text: ctx.format.info(`Waktu habis! Jawaban yang belum terjawab: ${remaining}`),
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
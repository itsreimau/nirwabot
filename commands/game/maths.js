const sessions = new Map();

const levels = {
    noob: {
        label: "Noob",
        bonus: 1
    },
    easy: {
        label: "Mudah",
        bonus: 2
    },
    medium: {
        label: "Sedang",
        bonus: 3
    },
    hard: {
        label: "Sulit",
        bonus: 5
    },
    extreme: {
        label: "Ekstrim",
        bonus: 10
    },
    impossible: {
        label: "Mustahil",
        bonus: 15
    },
    impossible2: {
        label: "Mustahil II",
        bonus: 20
    }
};

module.exports = {
    name: "maths",
    category: "game",
    code: async (ctx) => {
        if (sessions.has(ctx.id)) return await ctx.reply(ctx.format.info("Sesi sedang berjalan."));

        try {
            const keys = Object.keys(levels);
            const input = ctx.args?.[0] && levels[ctx.args[0]] ? ctx.args[0] : keys[Math.floor(Math.random() * keys.length)];
            const apiUrl = ctx.api.createUrl("siputzx", "/api/games/maths", {
                level: input
            });
            const result = (await ctx.request.get(apiUrl)).data.data;

            const levelInfo = levels[result.mode];
            const game = {
                score: levelInfo.bonus,
                timeout: result.time,
                answer: String(result.result)
            };

            await ctx.reply({
                text: `✦ — ${result.str}\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Level")}: ${levelInfo.label}\n` +
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
                id: `${ctx.used.prefix + ctx.used.command} ${input}`
            }, {
                text: "Daftar Level",
                sections: [{
                    title: "Pilih Level",
                    highlight_label: "🌕",
                    rows: keys.map(key => ({
                        title: levels[key].label,
                        description: `Klik untuk memainkan level ${levels[key].label}`,
                        id: `${ctx.used.prefix + ctx.used.command} ${key}`
                    }))
                }]
            }];

            collector.on("collect", async (collCtx) => {
                const participantAnswer = collCtx.msg.body?.toLowerCase();
                const participantDb = collCtx.db.user;

                if (participantAnswer === game.answer) {
                    sessions.delete(ctx.id);
                    collector.stop();
                    participantDb.score += game.score;
                    participantDb.save();
                    await collCtx.reply({
                        text: ctx.format.info(`Benar! +${game.score} skor`),
                        buttons: playAgain
                    });
                } else if (participantAnswer === `surrender_${ctx.used.command}`) {
                    sessions.delete(ctx.id);
                    collector.stop();
                    await collCtx.reply({
                        text: ctx.format.info(`Menyerah! Jawaban: ${ctx.format.ucwords(game.answer)}`),
                        buttons: playAgain
                    });
                }
            });

            collector.on("end", async () => {
                if (sessions.has(ctx.id)) {
                    sessions.delete(ctx.id);
                    await ctx.reply({
                        text: ctx.format.info(`Waktu habis! Jawaban: ${ctx.format.ucwords(game.answer)}`),
                        buttons: playAgain
                    });
                }
            });
        } catch (error) {
            sessions.delete(ctx.id);
            await ctx.helper.reportError(ctx, error, true);
        }
    }
};
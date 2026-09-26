const sessions = new Map();

const levelBonus = {
    noob: 1,
    easy: 2,
    medium: 3,
    hard: 5,
    extreme: 10,
    impossible: 15,
    impossible2: 20
};
const levels = {
    noob: "Noob",
    easy: "Mudah",
    medium: "Sedang",
    hard: "Sulit",
    extreme: "Ekstrim",
    impossible: "Mustahil",
    impossible2: "Mustahil II"
};

module.exports = {
    name: "maths",
    category: "game",
    code: async (ctx) => {
        if (sessions.has(ctx.id)) return await ctx.reply(ctx.format.info("Sesi sedang berjalan."));

        try {
            const input = ctx.args?.[0] && levels.hasOwnProperty(ctx.args[0]) ? ctx.args[0] : "";
            const apiUrl = ctx.api.createUrl("siputzx", "/api/games/maths", {
                level: input
            });
            const result = (await ctx.request.get(apiUrl)).data.data;

            const game = {
                score: levelBonus[input] || 1,
                timeout: result.time,
                answer: String(result.result)
            };

            await ctx.reply({
                text: `✦ — ${result.str}\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Level")}: ${levels[result.mode]}\n` +
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
                    rows: Object.keys(levels).map(level => ({
                        title: levels[level],
                        description: `Klik untuk memainkan level ${levels[level]}`,
                        id: `${ctx.used.prefix + ctx.used.command} ${level}`
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
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
const sessions = new Map();

const levelBonus = {
    noob: 10,
    easy: 25,
    medium: 50,
    hard: 100,
    extreme: 250,
    impossible: 500,
    impossible2: 750,
    impossible3: 1000,
    impossible4: 1500,
    impossible5: 2000
};
const levels = {
    noob: "Noob",
    easy: "Mudah",
    medium: "Sedang",
    hard: "Sulit",
    extreme: "Ekstrim",
    impossible: "Mustahil",
    impossible2: "Mustahil II",
    impossible3: "Mustahil III",
    impossible4: "Mustahil IV",
    impossible5: "Mustahil V"
};

module.exports = {
    name: "maths",
    category: "game",
    code: async (ctx) => {
        if (sessions.has(ctx.id)) return await ctx.reply(ctx.format.info("Sesi permainan sedang berjalan!"));

        try {
            const input = ctx.args?.[0] && levels.hasOwnProperty(ctx.args[0]) ? ctx.args[0] : "random";
            const apiUrl = ctx.api.createUrl("siputzx", "/api/games/maths", {
                level: input
            });
            const result = (await ctx.request.get(apiUrl)).data.data;

            const game = {
                coin: levelBonus[input] || 100,
                timeout: result.time,
                answer: String(result.result)
            };

            sessions.set(ctx.id, true);

            await ctx.reply({
                text: `✦ — ${result.str}\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Level")}: ${levels[result.mode]}\n` +
                    `❖ ${ctx.format.bold("Bonus")}: ${game.coin} koin\n` +
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
                const isUnlimited = collCtx.sender.isOwner() || participantDb?.premium;

                if (participantAnswer === game.answer) {
                    sessions.delete(ctx.id);
                    collector.stop();
                    if (!isUnlimited) participantDb.coin += game.coin;
                    participantDb.winGame += 1;
                    participantDb.save();
                    await collCtx.reply({
                        text: ctx.format.info(`Benar! +${game.coin} koin`),
                        buttons: playAgain
                    });
                } else if (participantAnswer === `surrender_${ctx.used.command}`) {
                    sessions.delete(ctx.id);
                    collector.stop();
                    await collCtx.reply({
                        text: ctx.format.info(`Anda menyerah! Jawaban: ${ctx.format.ucwords(game.answer)}`),
                        buttons: playAgain
                    });
                }
            });

            collector.on("end", async (reason) => {
                if (reason === "timeout" && sessions.has(ctx.id)) {
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
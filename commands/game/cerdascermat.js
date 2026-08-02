const session = new Map();

module.exports = {
    name: "cerdascermat",
    category: "game",
    permissions: {
        coin: 5
    },
    code: async (ctx) => {
        if (session.has(ctx.id)) return await ctx.reply(ctx.format.info("Sesi permainan sedang berjalan!"));

        try {
            const mapel = {
                bindo: "Bahasa Indonesia",
                tik: "Teknologi Informasi dan Komunikasi",
                pkn: "Pelajaran Pendidikan Pancasila dan Kewarganegaraan",
                bing: "Bahasa Inggris",
                penjas: "Pendidikan Jasmani dan Kesehatan",
                pai: "Pendidikan Agama Islam",
                matematika: "Matematika",
                jawa: "Bahasa Jawa",
                ips: "Ilmu Pengetahuan Sosial",
                ipa: "Ilmu Pengetahuan Alam"
            };
            const input = ctx.args?.[0] && mapel[ctx.args[0]] ? ctx.args[0] : "tik";
            const apiUrl = ctx.api.createUrl("siputzx", "/api/games/cc-sd", {
                matapelajaran: input
            });
            const result = ctx.helper.getRandomElement((await ctx.request.get(apiUrl)).data.data.soal);

            const game = {
                coin: 5,
                timeout: 60000,
                answerKey: result.jawaban_benar,
                answer: result.semua_jawaban.find(ans => Object.keys(ans)[0] === result.jawaban_benar)[result.jawaban_benar].toLowerCase()
            };

            session.set(ctx.id, true);

            await ctx.reply({
                text: `✦ — ${result.pertanyaan}\n` +
                    `${result.semua_jawaban.map(answers => {
                        const answer = Object.keys(answers)[0];
                        return `${answer.toUpperCase()}. ${answers[answer]}`;
                    }).join("\n")}\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Mata Pelajaran")}: ${mapel[input]}\n` +
                    `❖ ${ctx.format.bold("Bonus")}: ${game.coin} koin\n` +
                    `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(game.timeout)}\n` +
                    `❖ ${ctx.format.bold("Cara menjawab")}: Ketik A, B, C, atau D`,
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
                text: "Daftar Mata Pelajaran",
                sections: [{
                    title: "Pilih Mata Pelajaran",
                    highlight_label: "🌕",
                    rows: Object.keys(mapel).map(key => ({
                        title: key.toUpperCase(),
                        description: `Klik untuk memainkan mata pelajaran ${mapel[key]}`,
                        id: `${ctx.used.prefix + ctx.used.command} ${key}`
                    }))
                }]
            }];

            collector.on("collect", async (collCtx) => {
                const participantAnswer = collCtx.msg.body?.toLowerCase();
                const participantDb = collCtx.db.user;
                const isUnlimited = collCtx.sender.isOwner() || participantDb?.premium;

                if (participantAnswer === game.answerKey) {
                    session.delete(ctx.id);
                    collector.stop();
                    if (!isUnlimited) participantDb.coin += game.coin;
                    participantDb.winGame += 1;
                    participantDb.save();
                    await collCtx.reply({
                        text: ctx.format.info(`Benar! +${game.coin} koin`),
                        buttons: playAgain
                    });
                } else if (participantAnswer === `surrender_${ctx.used.command}`) {
                    session.delete(ctx.id);
                    collector.stop();
                    await collCtx.reply({
                        text: ctx.format.info(`Anda menyerah! Jawaban: ${game.answer} (${game.answerKey.toUpperCase()})`),
                        buttons: playAgain
                    });
                }
            });

            collector.on("end", async () => {
                if (session.has(ctx.id)) {
                    session.delete(ctx.id);
                    await ctx.reply({
                        text: ctx.format.info(`Waktu habis! Jawaban: ${game.answer} (${game.answerKey.toUpperCase()})`),
                        buttons: playAgain
                    });
                }
            });
        } catch (error) {
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
const sessions = new Map();

module.exports = {
    name: "cerdascermat",
    category: "game",
    code: async (ctx) => {
        if (sessions.has(ctx.id)) return await ctx.reply(ctx.format.info("Sesi permainan sedang berjalan!"));

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
            const input = ctx.args?.[0] && mapel[ctx.args[0]] ? ctx.args[0] : mapel[Math.floor(Math.random() * 10) + 1];
            const apiUrl = ctx.api.createUrl("siputzx", "/api/games/cc-sd", {
                matapelajaran: input
            });
            const result = ctx.helper.getRandomElement((await ctx.request.get(apiUrl)).data.data.soal);

            const game = {
                coin: 5,
                timeout: 60000,
                answerKey: result.jawaban_benar,
                answer: result.semua_jawaban.find(ans => Object.keys(ans)[0] === result.jawaban_benar)[result.jawaban_benar].toLowerCase(),
                wrongAnswered: []
            };

            sessions.set(ctx.id, true);

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
                    `❖ ${ctx.format.bold("Cara menjawab")}: Ketik hanya pilihan jawabannya saja tanpa mengetik jawaban lengkap, misalnya: A, B, dan seterusnya.`,
                buttons: [{
                    text: "Menyerah",
                    id: `surrender_${ctx.used.command}`
                }]
            });

            const collector = ctx.MessageCollector({
                time: game.timeout,
                filter: (collCtx) => {
                    if (collCtx.msg.body?.startsWith(`surrender_`)) return true;
                    const body = collCtx.msg.body?.toLowerCase() || "";
                    return body.length === 1 && result.semua_jawaban.map(ans => Object.keys(ans)[0].toLowerCase()).includes(body);
                }
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

                if (game.wrongAnswered.includes(collCtx.sender.jid)) return;
                if (participantAnswer === game.answerKey) {
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
                        text: ctx.format.info(`Anda menyerah! Jawaban: ${game.answer} (${game.answerKey.toUpperCase()})`),
                        buttons: playAgain
                    });
                } else {
                    game.wrongAnswered.push(collCtx.sender.jid);
                    await collCtx.reply(ctx.format.info(`Salah!`));
                }
            });

            collector.on("end", async (reason) => {
                if (reason === "timeout" && sessions.has(ctx.id)) {
                    sessions.delete(ctx.id);
                    await ctx.reply({
                        text: ctx.format.info(`Waktu habis! Jawaban: ${game.answer} (${game.answerKey.toUpperCase()})`),
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
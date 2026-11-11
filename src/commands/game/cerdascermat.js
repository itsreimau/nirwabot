const sessions = new Map();

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

module.exports = {
    name: "cerdascermat",
    aliases: ["cc"],
    category: "game",
    code: async (ctx) => {
        if (sessions.has(ctx.id)) return await ctx.reply(ctx.format.info("Sesi sedang berjalan."));

        try {
            const keys = Object.keys(mapel);
            const input = ctx.args?.[0] && mapel[ctx.args[0]] ? ctx.args[0] : keys[Math.floor(Math.random() * keys.length)];
            const apiUrl = ctx.api.createUrl("siputzx", "/api/games/cc-sd", {
                matapelajaran: input
            });
            const result = ctx.helper.getRandomElement((await ctx.request.get(apiUrl)).data.data.soal);

            const game = {
                timeout: 60000,
                answerKey: result.jawaban_benar,
                answer: result.semua_jawaban.find(answers => Object.keys(answers)[0] === result.jawaban_benar)[result.jawaban_benar].toLowerCase(),
                wrongAnswered: []
            };

            await ctx.reply({
                text: `✦ — ${result.pertanyaan}\n` +
                    `${result.semua_jawaban.map(answers => {
                        const answer = Object.keys(answers)[0];
                        return `${answer.toUpperCase()}. ${answers[answer]}`;
                    }).join("\n")}\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Mapel")}: ${mapel[input]}\n` +
                    `❖ ${ctx.format.bold("Waktu")}: ${ctx.format.convertMsToDuration(game.timeout)}\n` +
                    `❖ ${ctx.format.bold("Jawab")}: Ketik A/B/C/...`,
                buttons: [{
                    text: "Menyerah",
                    id: `surrender_${ctx.used.command}`
                }]
            });

            const collector = ctx.MessageCollector({
                time: game.timeout,
                filter: (collCtx) => {
                    if (collCtx.msg.body?.startsWith("surrender_")) return true;
                    const body = collCtx.msg.body?.toLowerCase() || "";
                    return body.length === 1 && result.semua_jawaban.some(answers => Object.keys(answers)[0].toLowerCase() === body);
                }
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
                text: "Daftar Mapel",
                sections: [{
                    title: "Pilih Mapel",
                    highlight_label: "🌕",
                    rows: keys.map(key => ({
                        title: key.toUpperCase(),
                        description: `Klik untuk memainkan mapel ${mapel[key]}`,
                        id: `${ctx.used.prefix + ctx.used.command} ${key}`
                    }))
                }]
            }];

            collector.on("collect", async (collCtx) => {
                const participantAnswer = collCtx.msg.body?.toLowerCase();
                const participantDb = collCtx.db.user;

                if (game.wrongAnswered.includes(collCtx.sender.jid)) return;
                if (participantAnswer === game.answerKey) {
                    sessions.delete(ctx.id);
                    collector.stop();
                    participantDb.score += 1;
                    participantDb.save();
                    await collCtx.reply({
                        text: ctx.format.info("Benar! +1 skor"),
                        buttons: playAgain
                    });
                } else if (participantAnswer === `surrender_${ctx.used.command}`) {
                    sessions.delete(ctx.id);
                    collector.stop();
                    await collCtx.reply({
                        text: ctx.format.info(`Menyerah! Jawaban: ${game.answer} (${game.answerKey.toUpperCase()})`),
                        buttons: playAgain
                    });
                } else {
                    game.wrongAnswered.push(collCtx.sender.jid);
                    await collCtx.reply(ctx.format.info("Salah!"));
                }
            });

            collector.on("end", async () => {
                if (sessions.has(ctx.id)) {
                    sessions.delete(ctx.id);
                    await ctx.reply({
                        text: ctx.format.info(`Waktu habis! Jawaban: ${game.answer} (${game.answerKey.toUpperCase()})`),
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
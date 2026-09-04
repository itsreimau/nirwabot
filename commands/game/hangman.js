const sessions = new Map();

const render = (word, guessed) => word.split("").map(c => guessed.has(c) ? c : "_").join(" ");

module.exports = {
    name: "hangman",
    category: "game",
    code: async (ctx) => {
        const sessionsKey = `${ctx.id}_${ctx.sender.lid}`;
        if (sessions.has(sessionsKey)) return await ctx.reply(ctx.format.info("Sesi permainan sedang berjalan!"));

        try {
            const words = (await ctx.request.get("https://raw.githubusercontent.com/siuspsrb/database/main/game/kbbi.json")).data.filter(w => w.length > 1);
            const word = ctx.helper.getRandomElement(words);
            const game = {
                coin: 10,
                timeout: Math.min(30000 + (new Set(word.split("")).size * 5000), 120000),
                guessed: new Set(),
                lives: 6
            };

            sessions.set(sessionsKey, true);

            await ctx.reply({
                text: `✦ — ${render(word, new Set())}\n` +
                    `Ketik huruf untuk menebak.\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Bonus")}: ${game.coin} koin\n` +
                    `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(game.timeout)}\n` +
                    `❖ ${ctx.format.bold("Nyawa")}: ${game.lives}`,
                buttons: [{
                    text: "Menyerah",
                    id: `surrender_${ctx.used.command}`
                }]
            });

            const collector = ctx.MessageCollector({
                time: game.timeout,
                filter: (collCtx) => {
                    if (ctx.helper.areJidsSameUser(collCtx.sender.lid, ctx.sender.lid)) return false;
                    if (collCtx.msg.body?.startsWith(`surrender_`)) return true;
                    const body = collCtx.msg.body?.toLowerCase() || "";
                    return body.length === 1 && /[a-z]/.test(body);
                }
            });
            setTimeout(() => {
                if (sessions.has(sessionsKey)) {
                    sessions.delete(sessionsKey);
                    collector.stop();
                }
            }, game.timeout + 5000);
            const playAgain = [{
                text: "Main Lagi",
                id: ctx.used.prefix + ctx.used.command
            }];

            collector.on("collect", async (collCtx) => {
                const answer = collCtx.msg.body?.toLowerCase();
                const isUnlimited = collCtx.sender.isOwner() || collCtx.db.user?.premium;

                if (game.guessed.has(answer)) await collCtx.reply("Huruf sudah ditebak!");
                game.guessed.add(answer);

                const display = render(word, game.guessed);
                if (!display.includes("_")) {
                    sessions.delete(sessionsKey);
                    collector.stop();
                    const senderDb = collCtx.db.user;
                    if (!isUnlimited) senderDb.coin += game.coin;
                    senderDb.winGame += 1;
                    senderDb.save();
                    await collCtx.reply({
                        text: ctx.format.info(`Benar! Jawaban: ${word} +${game.coin} koin`),
                        buttons: playAgain
                    });
                } else if (!word.includes(answer)) {
                    game.lives--;
                    if (game.lives <= 0) {
                        sessions.delete(sessionsKey);
                        collector.stop();
                        await collCtx.reply({
                            text: ctx.format.info(`Permainan berakhir! Jawaban: ${word}`),
                            buttons: playAgain
                        });
                    }
                } else if (answer === `surrender_${ctx.used.command}`) {
                    sessions.delete(sessionsKey);
                    collector.stop();
                    return await collCtx.reply({
                        text: ctx.format.info(`Anda menyerah! Jawaban: ${word}`),
                        buttons: playAgain
                    });
                }

                await collCtx.reply(
                    `✦ — ${display}\n` +
                    `Ketik huruf untuk menebak lagi.\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Nyawa")}: ${game.lives}\n` +
                    `❖ ${ctx.format.bold("Huruf")}: ${[...game.guessed].join(", ")}`
                );
            });

            collector.on("end", async () => {
                if (sessions.has(ctx.id)) {
                    sessions.delete(sessionsKey);
                    await ctx.reply({
                        text: ctx.format.info(`Waktu habis! Jawaban: ${word}`),
                        buttons: playAgain
                    });
                }
            });
        } catch (error) {
            sessions.delete(sessionsKey);
            await ctx.helper.handleError(ctx, error, true);
        }
    }
};
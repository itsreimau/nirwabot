const sessions = new Map();

class QuizGame {
    constructor(option) {
        this.name = option.name;
        this.apiEndpoint = option.apiEndpoint;
        this.coinReward = option.coinReward || 5;
        this.hintCost = option.hintCost || 3;
        this.timeout = option.timeout || 60000;
        this.answerKey = option.answerKey || "jawaban";
        this.questionKey = option.questionKey || "soal";
        this.imageKey = option.imageKey || null;
        this.audioKey = option.audioKey || null;
        this.extraFields = option.extraFields || [];
        this.formatQuestion = option.formatQuestion || this.defaultFormatQuestion;
        this.formatAnswer = option.formatAnswer || this.defaultFormatAnswer;
        this.aliases = option.aliases || [];
    }

    defaultFormatQuestion(ctx, data) {
        let text = `✦ — ${data[this.questionKey]}\n` +
            "\n" +
            `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
            `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}\n`;
        for (const field of this.extraFields) {
            if (data[field.key]) text += `❖ ${ctx.format.bold(field.label)}: ${data[field.key]}\n`;
        }
        return text.trim();
    }

    defaultFormatAnswer(ctx, answer) {
        return ctx.format.ucwords(answer);
    }

    async handle(ctx) {
        const sessionKey = `${ctx.id}_${this.name}`;
        if (sessions.has(sessionKey)) return await ctx.reply(ctx.format.info("Sesi permainan sedang berjalan!"));

        try {
            const apiUrl = ctx.api.createUrl("siputzx", this.apiEndpoint);
            const response = await ctx.request.get(apiUrl);
            const data = response.data?.data?.data || response.data?.data || response.data;
            const game = {
                coin: this.coinReward,
                timeout: this.timeout,
                answer: data[this.answerKey]?.toLowerCase() || ""
            };

            sessions.set(sessionKey, true);

            const messageContent = {
                text: this.formatQuestion(ctx, data),
                buttons: [{
                    text: `Petunjuk (-${this.hintCost} koin)`,
                    id: `hint_${ctx.used.command}`
                }, {
                    text: "Menyerah",
                    id: `surrender_${ctx.used.command}`
                }]
            };

            if (this.imageKey && data[this.imageKey]) {
                await ctx.reply({
                    image: {
                        url: data[this.imageKey]
                    },
                    caption: messageContent.text,
                    buttons: messageContent.buttons
                });
            } else if (this.audioKey && data[this.audioKey]) {
                await ctx.reply({
                    audio: {
                        url: data[this.audioKey]
                    }
                });
                await ctx.reply(messageContent);
            } else {
                await ctx.reply(messageContent);
            }

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

                if (participantAnswer === game.answer) {
                    sessions.delete(sessionKey);
                    collector.stop();
                    if (!isUnlimited) participantDb.coin += game.coin;
                    participantDb.winGame += 1;
                    participantDb.save();
                    await collCtx.reply({
                        text: ctx.format.info(`Benar! +${game.coin} Koin`),
                        buttons: playAgain
                    });
                } else if (participantAnswer === `hint_${ctx.used.command}`) {
                    if (!isUnlimited) {
                        if (participantDb.coin < this.hintCost) return await collCtx.reply(ctx.format.info(config.msg.coin));
                        participantDb.coin -= this.hintCost;
                        participantDb.save();
                    }
                    const clue = game.answer.replace(/[aiueo]/g, "_");
                    await collCtx.reply(ctx.format.monospace(clue.toUpperCase()));
                    return;
                } else if (participantAnswer === `surrender_${ctx.used.command}`) {
                    sessions.delete(sessionKey);
                    collector.stop();
                    const formattedAnswer = this.formatAnswer(ctx, game.answer);
                    await collCtx.reply({
                        text: ctx.format.info(`Anda menyerah! Jawaban: ${formattedAnswer}.`),
                        buttons: playAgain
                    });
                    return;
                } else if (ctx.helper.didYouMean(participantAnswer, [game.answer]) === game.answer) {
                    await collCtx.reply(ctx.format.info("Sedikit lagi!"));
                }
            });

            collector.on("end", async (reason) => {
                if (reason === "timeout" && sessions.has(ctx.id)) {
                    sessions.delete(sessionKey);
                    const formattedAnswer = this.formatAnswer(ctx, game.answer);
                    await ctx.reply({
                        text: ctx.format.info(`Waktu habis! Jawaban: ${formattedAnswer}.`),
                        buttons: playAgain
                    });
                }
            });
        } catch (error) {
            sessions.delete(sessionKey);
            await ctx.helper.handleError(ctx, error, true);
        }
    }
}

const options = {
    asahotak: {
        name: "asahotak",
        apiEndpoint: "/api/games/asahotak",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    },
    caklontong: {
        name: "caklontong",
        apiEndpoint: "/api/games/caklontong",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        extraFields: [{
            key: "deskripsi",
            label: "Deskripsi"
        }],
        formatAnswer(ctx, data) {
            const answer = data[this.answerKey] || "";
            const description = data.deskripsi || "";
            return `${ctx.format.ucwords(answer)} (${description})`;
        }
    },
    lengkapikalimat: {
        name: "lengkapikalimat",
        apiEndpoint: "/api/games/lengkapikalimat",
        answerKey: "jawaban",
        questionKey: "pertanyaan",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    },
    siapakahaku: {
        name: "siapakahaku",
        apiEndpoint: "/api/games/siapakahaku",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    },
    susunkata: {
        name: "susunkata",
        apiEndpoint: "/api/games/susunkata",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        extraFields: [{
            key: "tipe",
            label: "Tipe"
        }]
    },
    tebakbendera: {
        name: "tebakbendera",
        apiEndpoint: "/api/games/tebakbendera",
        answerKey: "name",
        questionKey: null,
        imageKey: "img",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Bendera negara apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakgame: {
        name: "tebakgame",
        apiEndpoint: "/api/games/tebakgame",
        answerKey: "jawaban",
        questionKey: null,
        imageKey: "img",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Game apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakgambar: {
        name: "tebakgambar",
        apiEndpoint: "/api/games/tebakgambar",
        answerKey: "jawaban",
        questionKey: "deskripsi",
        imageKey: "img",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    },
    tebakhewan: {
        name: "tebakhewan",
        apiEndpoint: "/api/games/tebakhewan",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    },
    tebakheroml: {
        name: "tebakheroml",
        aliases: ["tebakml"],
        apiEndpoint: "/api/games/tebakheroml",
        answerKey: "name",
        questionKey: null,
        audioKey: "audio",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Dengarkan suara hero Mobile Legends ini!\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakjkt48: {
        name: "tebakjkt48",
        aliases: ["tebakjkt"],
        apiEndpoint: "/api/games/tebakjkt",
        answerKey: "jawaban",
        questionKey: null,
        imageKey: "gambar",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Siapa member JKT48 ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakkalimat: {
        name: "tebakkalimat",
        apiEndpoint: "/api/games/tebakkalimat",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    },
    tebakkarakterff: {
        name: "tebakkarakterff",
        aliases: ["tebakff"],
        apiEndpoint: "/api/games/karakter-freefire",
        answerKey: "name",
        questionKey: null,
        imageKey: "gambar",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Siapa karakter Free Fire ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakkartun: {
        name: "tebakkartun",
        apiEndpoint: "/api/games/tebakkartun",
        answerKey: "name",
        questionKey: null,
        imageKey: "img",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Kartun apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakkata: {
        name: "tebakkata",
        apiEndpoint: "/api/games/tebakkata",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    },
    tebakkimia: {
        name: "tebakkimia",
        apiEndpoint: "/api/games/tebakkimia",
        answerKey: "unsur",
        questionKey: null,
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Lambang ${data.lambang} adalah unsur apa?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebaklagu: {
        name: "tebaklagu",
        apiEndpoint: "/api/games/tebaklagu",
        answerKey: "judul",
        questionKey: null,
        audioKey: "lagu",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Lagu apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebaklirik: {
        name: "tebaklirik",
        apiEndpoint: "/api/games/tebaklirik",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    },
    tebaklogo: {
        name: "tebaklogo",
        apiEndpoint: "/api/games/tebaklogo",
        answerKey: "jawaban",
        questionKey: null,
        imageKey: "image",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Logo apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebaktebakan: {
        name: "tebaktebakan",
        apiEndpoint: "/api/games/tebaktebakan",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    },
    tebakwarna: {
        name: "tebakwarna",
        apiEndpoint: "/api/games/tebakwarna",
        answerKey: "correct",
        questionKey: null,
        imageKey: "image",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Angka berapa yang terlihat?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Bonus")}: ${this.coinReward} Koin\n` +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tekateki: {
        name: "tekateki",
        apiEndpoint: "/api/games/tekateki",
        answerKey: "jawaban",
        questionKey: "soal",
        coinReward: 5,
        hintCost: 3,
        timeout: 60000
    }
};

module.exports = Object.entries(options).map(([name, option]) => {
    const game = new QuizGame(option);
    return {
        name: option.name || name,
        aliases: option.aliases || [],
        category: "game",
        code: async (ctx) => await game.handle(ctx)
    };
});
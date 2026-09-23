const sessions = new Map();

class QuizGame {
    constructor(option) {
        this.name = option.name;
        this.apiEndpoint = option.apiEndpoint;
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
            `❖ ${ctx.format.bold("Waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}\n`;
        for (const field of this.extraFields) {
            if (data[field.key]) text += `❖ ${ctx.format.bold(field.label)}: ${data[field.key]}\n`;
        }
        return text.trim();
    }

    defaultFormatAnswer(ctx, answer) {
        return ctx.format.ucwords(answer);
    }

    async getQuestionData(ctx) {
        const apiUrl = ctx.api.createUrl("siputzx", this.apiEndpoint);
        const res = await ctx.request.get(apiUrl);
        return res.data?.data?.data || res.data?.data || res.data;
    }

    async handle(ctx) {
        const sessionKey = `${ctx.id}_${this.name}`;
        if (sessions.has(sessionKey)) return await ctx.reply(ctx.format.info("Sesi sedang berjalan."));

        try {
            let data = await this.getQuestionData(ctx);
            let maxRetry = 3;
            while (maxRetry > 0) {
                const mediaUrl = this.imageKey ? data[this.imageKey] : (this.audioKey ? data[this.audioKey] : null);
                if (!mediaUrl) break;
                try {
                    await ctx.request.get(mediaUrl, {
                        method: "HEAD"
                    });
                    break;
                } catch {
                    maxRetry--;
                    data = await this.getQuestionData(ctx);
                }
            }
            const game = {
                timeout: this.timeout,
                answer: data[this.answerKey].toLowerCase(),
                data
            };

            const messageContent = {
                text: this.formatQuestion(ctx, game.data),
                buttons: [{
                    text: "Petunjuk (-1 skor)",
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
            sessions.set(sessionKey, true);
            setTimeout(() => {
                if (sessions.has(sessionKey)) {
                    sessions.delete(sessionKey);
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

                if (participantAnswer === game.answer) {
                    sessions.delete(sessionKey);
                    collector.stop();
                    participantDb.score += 1;
                    participantDb.save();
                    await collCtx.reply({
                        text: ctx.format.info("Benar! 1 skor"),
                        buttons: playAgain
                    });
                } else if (participantAnswer === `hint_${ctx.used.command}`) {
                    if (participantDb.score < 1) return await collCtx.reply(ctx.format.info(config.msg.ticket));
                    participantDb.score -= 1;
                    participantDb.save();
                    const clue = game.answer.replace(/\S/g, (c) => /[aiueo]/.test(c) ? "_" : c);
                    await collCtx.reply(ctx.format.monospace(clue.toUpperCase()));
                } else if (participantAnswer === `surrender_${ctx.used.command}`) {
                    sessions.delete(sessionKey);
                    collector.stop();
                    const formattedAnswer = this.formatAnswer(ctx, game.answer, game.data);
                    await collCtx.reply({
                        text: ctx.format.info(`Menyerah! Jawaban: ${formattedAnswer}`),
                        buttons: playAgain
                    });
                } else if (ctx.helper.didYouMean(participantAnswer, [game.answer]) === game.answer) {
                    await collCtx.reply(ctx.format.info("Sedikit lagi!"));
                }
            });

            collector.on("end", async () => {
                if (sessions.has(sessionKey)) {
                    sessions.delete(sessionKey);
                    const formattedAnswer = this.formatAnswer(ctx, game.answer, game.data);
                    await ctx.reply({
                        text: ctx.format.info(`Waktu habis! Jawaban: ${formattedAnswer}`),
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
        timeout: 60000
    },
    caklontong: {
        name: "caklontong",
        apiEndpoint: "/api/games/caklontong",
        answerKey: "jawaban",
        questionKey: "soal",
        timeout: 60000,
        formatAnswer(ctx, answer, data) {
            return `${ctx.format.ucwords(answer)} (${data.deskripsi})`;
        }
    },
    lengkapikalimat: {
        name: "lengkapikalimat",
        apiEndpoint: "/api/games/lengkapikalimat",
        answerKey: "jawaban",
        questionKey: "pertanyaan",
        timeout: 60000
    },
    siapakahaku: {
        name: "siapakahaku",
        apiEndpoint: "/api/games/siapakahaku",
        answerKey: "jawaban",
        questionKey: "soal",
        timeout: 60000
    },
    susunkata: {
        name: "susunkata",
        apiEndpoint: "/api/games/susunkata",
        answerKey: "jawaban",
        questionKey: "soal",
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
        timeout: 60000,
        formatQuestion(ctx) {
            return `✦ — Bendera negara apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakgame: {
        name: "tebakgame",
        apiEndpoint: "/api/games/tebakgame",
        answerKey: "jawaban",
        questionKey: null,
        imageKey: "img",
        timeout: 60000,
        formatQuestion(ctx) {
            return `✦ — Game apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakgambar: {
        name: "tebakgambar",
        apiEndpoint: "/api/games/tebakgambar",
        answerKey: "jawaban",
        questionKey: "deskripsi",
        imageKey: "img",
        timeout: 60000
    },
    tebakhewan: {
        name: "tebakhewan",
        apiEndpoint: "/api/games/tebakhewan",
        answerKey: "jawaban",
        questionKey: "soal",
        timeout: 60000
    },
    tebakheroml: {
        name: "tebakheroml",
        aliases: ["tebakml"],
        apiEndpoint: "/api/games/tebakheroml",
        answerKey: "name",
        questionKey: null,
        audioKey: "audio",
        timeout: 60000,
        formatQuestion(ctx) {
            return `✦ — Dengarkan suara hero Mobile Legends ini!\n` +
                "\n" +
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
        timeout: 60000,
        formatQuestion(ctx) {
            return `✦ — Siapa member JKT48 ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakkalimat: {
        name: "tebakkalimat",
        apiEndpoint: "/api/games/tebakkalimat",
        answerKey: "jawaban",
        questionKey: "soal",
        timeout: 60000
    },
    tebakkarakterff: {
        name: "tebakkarakterff",
        aliases: ["tebakff"],
        apiEndpoint: "/api/games/karakter-freefire",
        answerKey: "name",
        questionKey: null,
        imageKey: "gambar",
        timeout: 60000,
        formatQuestion(ctx) {
            return `✦ — Siapa karakter Free Fire ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakkartun: {
        name: "tebakkartun",
        apiEndpoint: "/api/games/tebakkartun",
        answerKey: "name",
        questionKey: null,
        imageKey: "img",
        timeout: 60000,
        formatQuestion(ctx) {
            return `✦ — Kartun apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebakkata: {
        name: "tebakkata",
        apiEndpoint: "/api/games/tebakkata",
        answerKey: "jawaban",
        questionKey: "soal",
        timeout: 60000
    },
    tebakkimia: {
        name: "tebakkimia",
        apiEndpoint: "/api/games/tebakkimia",
        answerKey: "unsur",
        questionKey: null,
        timeout: 60000,
        formatQuestion(ctx, data) {
            return `✦ — Lambang ${data.lambang} adalah unsur apa?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebaklagu: {
        name: "tebaklagu",
        apiEndpoint: "/api/games/tebaklagu",
        answerKey: "judul",
        questionKey: null,
        audioKey: "lagu",
        timeout: 60000,
        formatQuestion(ctx) {
            return `✦ — Lagu apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebaklirik: {
        name: "tebaklirik",
        apiEndpoint: "/api/games/tebaklirik",
        answerKey: "jawaban",
        questionKey: "soal",
        timeout: 60000
    },
    tebaklogo: {
        name: "tebaklogo",
        apiEndpoint: "/api/games/tebaklogo",
        answerKey: "jawaban",
        questionKey: null,
        imageKey: "image",
        timeout: 60000,
        formatQuestion(ctx) {
            return `✦ — Logo apa ini?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tebaktebakan: {
        name: "tebaktebakan",
        apiEndpoint: "/api/games/tebaktebakan",
        answerKey: "jawaban",
        questionKey: "soal",
        timeout: 60000
    },
    tebakwarna: {
        name: "tebakwarna",
        apiEndpoint: "/api/games/tebakwarna",
        answerKey: "correct",
        questionKey: null,
        imageKey: "image",
        timeout: 60000,
        formatQuestion(ctx) {
            return `✦ — Angka berapa yang terlihat?\n` +
                "\n" +
                `❖ ${ctx.format.bold("Batas waktu")}: ${ctx.format.convertMsToDuration(this.timeout)}`;
        }
    },
    tekateki: {
        name: "tekateki",
        apiEndpoint: "/api/games/tekateki",
        answerKey: "jawaban",
        questionKey: "soal",
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
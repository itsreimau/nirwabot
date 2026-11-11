const QuizGame = require("../../lib/quiz-game");

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
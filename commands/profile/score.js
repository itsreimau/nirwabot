module.exports = {
    name: "score",
    aliases: ["skor"],
    category: "profile",
    code: async (ctx) => {
        const senderDb = ctx.db.user;
        await ctx.reply({
            text: ctx.format.info(`Skor: ${senderDb.score}, Bisa ditukar: ${Math.floor(senderDb.score / config.system.scorePerTicket)} tiket`),
            buttons: [{
                text: "Tukar",
                id: `${ctx.used.prefix}exchange`
            }]
        });
    }
};
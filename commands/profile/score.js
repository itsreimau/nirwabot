module.exports = {
    name: "score",
    aliases: ["skor"],
    category: "profile",
    code: async (ctx) => {
        const senderDb = ctx.db.user;
        await ctx.reply({
            text: `❖ ${ctx.format.bold("Skor")}: ${senderDb.score}\n` +
                `❖ ${ctx.format.bold("Bisa Ditukar")}: ${Math.floor(senderDb.score / config.system.scorePerTicket)} tiket`,
            buttons: [{
                text: "Tukar",
                id: `${ctx.used.prefix}exchange`
            }]
        });
    }
};
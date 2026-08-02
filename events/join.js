module.exports = (bot) => {
    bot.ev.on("BotJoin", async (join) => {
        const botDb = bot.getDb("bot");
        const lastPrefix = botDb?.lastPrefix || "/";
        await bot.sendMessage(join.id, {
            caption: `>ᴗ< ${bot.format.italic(`Halo! Saya adalah bot WhatsApp bernama ${config.bot.name}, dimiliki oleh ${config.owner.name}. Saya bisa melakukan banyak perintah, seperti membuat stiker, menggunakan AI untuk pekerjaan tertentu, dan beberapa perintah berguna lainnya. Saya di sini untuk menghibur dan menyenangkan Anda!`)}`,
            location: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: config.bot.name,
                address: "Jangan lupa berdonasi agar bot tetap online.",
                jpegThumbnail: await bot.helper.getJpegThumbnail(config.bot.thumbnail)
            },
            buttons: [{
                text: "Menu",
                id: `${lastPrefix}menu`
            }, {
                text: "Hubungi Owner",
                id: `${lastPrefix}owner`
            }, {
                text: "Donasi",
                id: `${lastPrefix}donate`
            }]
        });
    });
};
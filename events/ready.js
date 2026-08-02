const util = require("node:util");

module.exports = (bot) => {
    bot.ev.once("ClientReady", async (b) => {
        console.log(util.styleText("blue", "[>]"), `${config.bot.name} by ${config.owner.name}, ready at ${b.user?.id || b.user?.lid}`);

        const botDb = bot.getDb("bot");
        const botRestart = botDb?.restart || {};
        if (botRestart?.jid && botRestart?.timestamp && botRestart?.readyAt) {
            bot.readyAt = botRestart.readyAt;
            const timeago = bot.format.convertMsToDuration(Date.now() - botRestart.timestamp);
            await bot.sendMessage(botRestart.jid, {
                text: bot.format.info(`Berhasil dimulai ulang! Membutuhkan waktu ${timeago}.`),
                edit: botRestart.key
            });
            botDb.restart = {};
            botDb.save();
        }

        const groupLink = `https://chat.whatsapp.com/${config.bot?.groupJid ? await b.groupInviteCode(config.bot.groupJid).catch(() => "FxEYZl2UyzAEI2yhaH34Ye") : "FxEYZl2UyzAEI2yhaH34Ye"}`;
        if (!config.bot.groupLink || config.bot.groupLink !== groupLink) config.core.set("bot.groupLink", groupLink);
    });
};
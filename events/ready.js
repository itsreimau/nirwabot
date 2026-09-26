const util = require("node:util");

module.exports = (bot) => {
    bot.ev.once("ClientReady", async (b) => {
        console.log(util.styleText("blue", "[>]"), `${config.bot.name} by ${config.owner.name}, ready at ${b.user?.id || b.user?.lid}`);

        const botDb = bot.getDb("bot");
        const botRestart = botDb.restart;
        if (botRestart?.id && botRestart?.timestamp && botRestart?.readyAt) {
            bot.readyAt = botRestart.readyAt;
            const timeago = bot.format.convertMsToDuration(Date.now() - botRestart.timestamp);
            await bot.sendMessage(botRestart.id, {
                text: bot.format.info(`Restart selesai dalam ${timeago}.`),
                edit: botRestart.key
            });
            botDb.restart = {};
            botDb.save();
        }

        const groupLink = `https://chat.whatsapp.com/${config.bot?.groupJid ? await b.groupInviteCode(config.bot.groupJid).catch(() => "Gr2HXzc5UKFGLEO4Srpgzb") : "Gr2HXzc5UKFGLEO4Srpgzb"}`;
        if (!config.bot.groupLink || config.bot.groupLink !== groupLink) config.core.set("bot.groupLink", groupLink);
    });
};
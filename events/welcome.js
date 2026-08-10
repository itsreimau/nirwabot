const moment = require("moment-timezone");

async function WelcomeHandler(bot, welcome, type, isSimulate = false) {
    const groupJid = welcome.id;
    const groupDb = bot.getDb("groups", groupJid);
    const botDb = bot.getDb("bot");
    const participantJid = welcome.participant;

    if (!isSimulate && groupDb?.mutebot) return;
    if (!isSimulate && !groupDb?.option?.welcome) return;
    if (!isSimulate && !["group", "public"].includes(botDb?.mode || "public")) return;

    const now = moment().tz(config.system.timeZone);
    const hour = now.hour();
    if (!isSimulate && config.system.unavailableAtNight && hour >= 0 && hour < 6) return;

    const isWelcome = type === "UserJoin";
    const tag = `@${bot.getId(participantJid)}`;
    const customText = isWelcome ? groupDb?.text?.welcome : groupDb?.text?.goodbye;
    const metadata = await bot.core.groupMetadata(groupJid);
    const text = customText ? customText.replace(/%tag%/g, tag).replace(/%subject%/g, metadata.subject).replace(/%description%/g, metadata.description) : (isWelcome ?
        `>ᴗ< ${bot.format.italic(`Selamat datang ${tag} di grup ${metadata.subject}!`)}` :
        `•︵• ${bot.format.italic(`Selamat tinggal, ${tag}!`)}`);

    await bot.sendMessage(groupJid, {
        text,
        mentions: [participantJid]
    });

    if (isWelcome && groupDb?.text?.intro)
        await bot.sendMessage(groupJid, {
            text: groupDb.text.intro,
            mentions: [participantJid],
            nativeFlow: [{
                text: "Salin Teks",
                copy: groupDb.text.intro
            }]
        });
}

module.exports = (bot) => {
    bot.ev.on("UserJoin", async (welcome) => WelcomeHandler(bot, welcome, "UserJoin"));
    bot.ev.on("UserLeave", async (welcome) => WelcomeHandler(bot, welcome, "UserLeave"));
};

module.exports.WelcomeHandler = WelcomeHandler;
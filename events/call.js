const Baileys = require("baileys");
const util = require("node:util");

module.exports = (bot) => {
    bot.ev.on("Events", async (call) => {
        if (!config.system.antiCall || call.status !== "offer") return;

        const fromJid = call.from;
        const fromId = bot.getId(fromJid);
        const isOwner = bot.checkOwner(fromJid);
        const fromDb = bot.getDb("users", fromJid);

        if (call?.isGroup || isOwner || fromDb?.banned) return;

        const fromPnJid = call.callerPn;
        const fromPnId = bot.getId(fromPnJid);

        console.log(util.styleText("magenta", "[~]"), `Incoming call from: ${fromPnJid}`);

        await bot.core.rejectCall(call.id, fromJid);

        fromDb.banned = true;
        fromDb.save();

        if (!config.system.restrict) {
            const reportOwner = bot.helper.getReportOwner();
            if (reportOwner && reportOwner.length > 0) {
                const {
                    delay
                } = bot.helper.calculateDelay(reportOwner.length);
                for (const ownerId of reportOwner) {
                    await bot.sendMessage(ownerId + Baileys.S_WHATSAPP_NET, {
                        text: bot.format.info(`Akun @${fromPnId} telah dibanned secara otomatis karena alasan ${bot.msg.inlineCode("Anti Call")}.`),
                        mentions: [fromPnJid]
                    });
                    await bot.helper.delay(delay);
                }
            }
            await bot.sendMessage(fromJid, {
                text: bot.format.info("Anda telah dibanned secara otomatis karena melanggar aturan!"),
                buttons: [{
                    text: "Hubungi Owner",
                    id: "/owner"
                }]
            });
        }
    });
};
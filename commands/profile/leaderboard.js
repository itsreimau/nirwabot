module.exports = {
    name: "leaderboard",
    aliases: ["lb", "peringkat"],
    category: "profile",
    code: async (ctx) => {
        const users = ctx.db.users.getAll();
        const senderLid = ctx.sender.lid;
        const senderId = ctx.getId(senderLid);

        const leaderboardData = users.map(user => ({
            jid: user.jid,
            pushName: user.pushName,
            level: user.level || 0,
            winGame: user.winGame || 0
        })).sort((a, b) => b.winGame - a.winGame || b.level - a.level);

        const userRank = leaderboardData.findIndex(user => ctx.helper.areJidsSameUser(user.jid, senderLid)) + 1;
        const topUsers = leaderboardData.slice(0, 10);
        let resultText = "";
        const mentions = [];

        topUsers.forEach((user, i) => {
            const isSelf = ctx.helper.areJidsSameUser(user.jid, senderLid);
            const displayUser = isSelf ? `@${senderId}` : (user.pushName || ctx.getId(user.jid));
            if (isSelf) mentions.push(senderLid);
            resultText += `❖ ${displayUser} - Menang: ${user.winGame}, Level: ${user.level}, Peringkat: ${i + 1}\n`;
        });

        if (userRank > 10) {
            const userStats = leaderboardData[userRank - 1];
            resultText += `❖ @${senderId} - Menang: ${userStats.winGame}, Level: ${userStats.level}, Peringkat: ${userRank}\n`;
            mentions.push(senderLid);
        }

        await ctx.reply({
            text: resultText.trim(),
            mentions
        });
    }
};
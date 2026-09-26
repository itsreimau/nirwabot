module.exports = {
    name: "leaderboard",
    aliases: ["lb", "peringkat", "rank"],
    category: "profile",
    code: async (ctx) => {
        const users = ctx.db.users.getAll();
        const senderJid = ctx.sender.jid;
        const senderId = ctx.getId(senderJid);
        const leaderboardData = users.map(user => ({
            id: user.id,
            pushName: user.pushName,
            score: user.score
        })).sort((a, b) => b.score - a.score);
        const userRank = leaderboardData.findIndex(u => ctx.helper.areJidsSameUser(u.id, senderJid)) + 1;
        const topUsers = leaderboardData.slice(0, 10);
        let resultText = "";
        const mentions = [];
        topUsers.forEach((user, i) => {
            const isSelf = ctx.helper.areJidsSameUser(user.id, senderJid);
            const displayUser = isSelf ? `@${senderId}` : (user.pushName || ctx.getId(user.id));
            if (isSelf) mentions.push(senderJid);
            resultText += `❖ ${displayUser} - Skor: ${user.score}, Peringkat: ${i + 1}\n`;
        });
        if (userRank > 10 && userRank <= leaderboardData.length) {
            const userStats = leaderboardData[userRank - 1];
            resultText += `❖ @${senderId} - Skor: ${userStats.score}, Peringkat: ${userRank}\n`;
            mentions.push(senderJid);
        }
        await ctx.reply({
            text: resultText.trim() || ctx.format.info(config.msg.notFound),
            mentions
        });
    }
};
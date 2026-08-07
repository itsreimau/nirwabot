module.exports = {
    name: "listapis",
    aliases: ["listapi"],
    category: "information",
    code: async (ctx) => {
        const APIs = ctx.api.listUrl();
        const resultText = Object.values(APIs).map(api => `❖ ${api.baseURL}`).join("\n");
        await ctx.reply(resultText.trim());
    }
};
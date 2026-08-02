module.exports = {
    name: "checkapis",
    aliases: ["cekapi", "checkapi"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const APIs = ctx.api.listUrl();
        let resultText = "";
        for (const [name, api] of Object.entries(APIs)) {
            try {
                const response = await ctx.request.get(api.baseURL, {
                    timeout: 5000,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15"
                    }
                });
                resultText += `❖ ${api.baseURL} ${response.status >= 200 && response.status < 500 ? ">ᴗ<" : "•︵•"} (${response.status})\n`;
            } catch (error) {
                const status = error.response?.status;
                resultText += `❖ ${api.baseURL} •︵• (${status || "Tidak ada respon"})\n`;
            }
        }
        await ctx.reply(resultText.trim());
    }
};
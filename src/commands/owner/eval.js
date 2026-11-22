const util = require("node:util");

module.exports = {
    name: /^==> |^=> /,
    type: "hears",
    silentError: true,
    code: async (ctx) => {
        if (!ctx.sender.isOwner()) return;
        const code = ctx.msg.body.slice(ctx.msg.body.startsWith("==> ") ? 4 : 3);
        const result = await eval(ctx.msg.body.startsWith("==> ") ? `(async () => { ${code} })()` : code);
        await ctx.reply(ctx.format.monospace(util.inspect(result, {
            depth: null,
            maxArrayLength: null,
            maxStringLength: null
        })));
    }
};
const { exec } = require("node:child_process");
const util = require("node:util");

module.exports = {
    name: /^\$ /,
    type: "hears",
    silentError: true,
    code: async (ctx) => {
        if (!ctx.sender.isOwner()) return;
        const command = ctx.msg.body.slice(2);
        const output = await util.promisify(exec)(command);
        await ctx.reply(ctx.format.monospace(output.stdout || output.stderr));
    }
};
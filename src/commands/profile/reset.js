module.exports = {
    name: "reset",
    category: "profile",
    permissions: {
        private: true
    },
    code: async (ctx) => {
        const input = ctx.args[0];
        if (input === "y") {
            ctx.db.users.reset(user => user.id === ctx.sender.jid);
            return await ctx.reply(ctx.format.info("Database direset."));
        } else if (input === "n") {
            return await ctx.reply(ctx.format.info("Reset dibatalkan."));
        }
        await ctx.reply({
            text: ctx.format.info("Reset database? Data akan hilang permanen."),
            buttons: [{
                text: "Ya",
                id: `${ctx.used.prefix + ctx.used.command} y`
            }, {
                text: "Tidak",
                id: `${ctx.used.prefix + ctx.used.command} n`
            }]
        });
    }
};
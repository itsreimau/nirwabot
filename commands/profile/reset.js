module.exports = {
    name: "reset",
    category: "profile",
    permissions: {
        private: true
    },
    code: async (ctx) => {
        const input = ctx.args[0];
        if (input === "y") {
            const usersDb = ctx.db.users;
            usersDb.reset(user => user.jid === ctx.sender.lid);
            return await ctx.reply(ctx.format.info("Database Anda telah berhasil direset!"));
        } else if (input === "n") {
            return await ctx.reply(ctx.format.info("Proses reset database telah dibatalkan."));
        }

        await ctx.reply({
            text: ctx.format.info("Yakin ingin mereset database Anda? Tindakan ini akan menghapus semua data yang tersimpan dan tidak dapat dipulihkan."),
            buttons: [{
                text: "Ya",
                id: `${ctx.used.prefix + ctx.used.command} yes`
            }, {
                text: "Tidak",
                id: `${ctx.used.prefix + ctx.used.command} no`
            }]
        });
    }
};
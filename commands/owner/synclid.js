module.exports = {
    name: "synclid",
    aliases: ["fixlid"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        try {
            const resolve = async (ids) => {
                const result = [...ids];
                for (const id of ids) {
                    const user = await ctx.core.findUserId(id).catch(() => null);
                    if (user?.lid) result.push(user.lid);
                }
                return result;
            };
            const ownerId = await resolve(config.owner.id || []);
            const ownerCo = await Promise.all((config.owner.co || []).map(async (co) => ({
                ...co,
                id: await resolve(co.id || [])
            })));
            config.core.set("owner.id", ownerId);
            config.core.set("owner.co", ownerCo);
            await ctx.reply({
                text: ctx.format.info("LID disinkronkan. Restart bot untuk menerapkan."),
                buttons: [{
                    text: "Restart",
                    id: `${ctx.used.prefix}restart`
                }]
            });
        } catch (error) {
            await ctx.helper.reportError(ctx, error);
        }
    }
};
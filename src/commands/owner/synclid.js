const Baileys = require("baileys");
const config = require("../../runtime/config");

module.exports = {
    name: "synclid",
    aliases: ["fixlid"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const resolve = async (ids) => {
            const normalizedIds = (Array.isArray(ids) ? ids : [ids]).filter(Boolean).map(id => Baileys.jidNormalizedUser(id));
            const pnSet = new Set();
            const lidSet = new Set();
            for (const id of normalizedIds) {
                if (Baileys.isPnUser(id)) pnSet.add(id);
                else if (Baileys.isLidUser(id)) lidSet.add(id);
                const user = await ctx.core.findUserId(id).catch(() => null);
                if (user?.phoneNumber) pnSet.add(Baileys.jidNormalizedUser(user.phoneNumber));
                if (user?.lid) lidSet.add(Baileys.jidNormalizedUser(user.lid));
            }
            return [...pnSet, ...lidSet];
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
    }
};
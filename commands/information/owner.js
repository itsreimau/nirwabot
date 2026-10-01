const Baileys = require("baileys");

module.exports = {
    name: "owner",
    aliases: ["creator", "developer"],
    category: "information",
    code: async (ctx) => {
        const contacts = [];
        const ownerIds = Array.isArray(config.owner.id) ? config.owner.id : [config.owner.id];
        for (const id of ownerIds.filter(Boolean)) {
            const pnId = Baileys.isPnUser(id) ? id : ownerIds.find(ownerId => Baileys.isPnUser(ownerId)) || null;
            if (!pnId) continue;
            contacts.push({
                displayName: config.owner.name,
                org: config.owner.organization,
                number: ctx.getId(pnId)
            });
        }
        if (config.owner.co?.length) {
            for (const co of config.owner.co) {
                if (co.invisible) continue;
                const coIds = Array.isArray(co.id) ? co.id : [co.id];
                const pnId = coIds.find(coId => Baileys.isPnUser(coId));
                if (!pnId) continue;
                contacts.push({
                    displayName: co.name,
                    org: co.organization,
                    number: ctx.getId(pnId)
                });
            }
        }
        await ctx.reply({
            contacts: {
                displayName: "Owner Bot",
                contacts
            }
        });
    }
};
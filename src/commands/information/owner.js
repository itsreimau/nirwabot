const Baileys = require("baileys");
const config = require("../../runtime/config");

module.exports = {
    name: "owner",
    aliases: ["creator", "developer"],
    category: "information",
    code: async (ctx) => {
        const contacts = [];
        const addedNumbers = new Set();
        const addContact = (ids, displayName, org) => {
            const list = Array.isArray(ids) ? ids.filter(Boolean) : [ids].filter(Boolean);
            const pnId = list.find(id => Baileys.isPnUser(id));
            if (!pnId) return;
            const number = ctx.getId(pnId);
            if (addedNumbers.has(number)) return;
            addedNumbers.add(number);
            contacts.push({
                displayName,
                org,
                number
            });
        };
        addContact(config.owner.id, config.owner.name, config.owner.organization);
        if (config.owner.co?.length) {
            for (const co of config.owner.co) {
                if (co.invisible) continue;
                addContact(co.id, co.name, co.organization);
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
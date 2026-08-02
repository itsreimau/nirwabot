module.exports = {
    name: "owner",
    aliases: ["creator", "developer"],
    category: "information",
    code: async (ctx) => {
        const contacts = [{
            displayName: config.owner.name,
            org: config.owner.organization,
            number: config.owner.id
        }];
        if (config.owner.co?.length) {
            const coOwners = config.owner.co.filter(co => !co.invisible).map(co => ({
                displayName: co.name,
                org: co.organization,
                number: co.id
            }));
            contacts.push(...coOwners);
        }
        await ctx.reply({
            contacts: {
                displayName: "Owner Bot",
                contacts
            }
        });
    }
};
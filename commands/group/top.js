const moment = require("moment-timezone");

class TopHandler {
    constructor(option) {
        this.name = option.name;
        this.aliases = option.aliases;
        this.sortDirection = option.sortDirection;
    }

    async handle(ctx) {
        const currentMembers = await ctx.group().members();
        const currentMemberIds = currentMembers.map(m => m.id);
        const groupDb = ctx.db.group;
        let members = groupDb.members;
        const currentMonth = moment().tz(config.system.timeZone).format("YYYY-MM");
        if (groupDb.lastTopResetMonth && groupDb.lastTopResetMonth !== currentMonth) {
            groupDb.members = members.map(member => ({
                ...member,
                sent: 0
            }));
            groupDb.lastTopResetMonth = currentMonth;
            groupDb.save();
        } else if (!groupDb.lastTopResetMonth) {
            groupDb.lastTopResetMonth = currentMonth;
            groupDb.save();
        }
        const filtered = members.filter(member => currentMemberIds.some(id => ctx.helper.areJidsSameUser(id, member.id)));
        if (filtered.length !== members.length) {
            groupDb.members = filtered;
            groupDb.save();
        }
        members = filtered.filter(member => !ctx.helper.areJidsSameUser(member.id, ctx.me.lid));
        members.sort((a, b) => this.sortDirection === "asc" ? a.sent - b.sent : b.sent - a.sent);
        const topMembers = members.slice(0, 10);
        const mentions = [];
        const text = topMembers.map((member, id) => {
            const isSelf = ctx.helper.areJidsSameUser(member.id, ctx.sender.jid);
            let displayName = member.pushName || ctx.getId(member.id);
            if (isSelf) {
                displayName = `@${ctx.getId(member.id)}`;
                mentions.push(member.id);
            }
            const prefix = id < 3 ? "❖" : `❖ ${id + 1}.`;
            return `${prefix} ${displayName} - ${member.sent} pesan`;
        }).join("\n");
        await ctx.reply({
            text: text.trim(),
            mentions
        });
    }
}

const options = {
    topsider: {
        name: "topsider",
        aliases: ["sider"],
        sortDirection: "asc"
    },
    topyapping: {
        name: "topyapping",
        aliases: ["yapping"],
        sortDirection: "desc"
    }
};

module.exports = Object.entries(options).map(([name, option]) => {
    const handler = new TopHandler(option);
    return {
        name: handler.name,
        aliases: handler.aliases,
        category: "group",
        permissions: {
            group: true
        },
        code: async (ctx) => await handler.handle(ctx)
    };
});
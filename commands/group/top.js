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
            groupDb.members = members.map(m => ({
                ...m,
                sent: 0
            }));
            groupDb.lastTopResetMonth = currentMonth;
            groupDb.save();
        } else if (!groupDb.lastTopResetMonth) {
            groupDb.lastTopResetMonth = currentMonth;
            groupDb.save();
        }
        const dirtyCount = members.length;
        members = members.filter(m => currentMemberIds.some(id => ctx.helper.areJidsSameUser(id, m.id)));
        if (members.length !== dirtyCount) {
            groupDb.members = members;
            groupDb.save();
        }
        members = members.filter(member => !ctx.helper.areJidsSameUser(member.id, ctx.me.lid));
        members.sort((a, b) => this.sortDirection === "asc" ? a.sent - b.sent : b.sent - a.sent);
        const topMembers = members.slice(0, 10);
        let text = "";
        let mentions = [];
        topMembers.forEach((member, id) => {
            const isSelf = ctx.helper.areJidsSameUser(member.id, ctx.sender.jid);
            let displayName = member.pushName || ctx.getId(member.id);
            if (isSelf) {
                const mentionId = ctx.getId(member.id);
                displayName = `@${mentionId}`;
                mentions.push(member.id);
            }
            const prefix = id === 0 ? "❖" : id === 1 ? "❖" : id === 2 ? "❖" : `❖ ${id + 1}.`;
            text += `${prefix} ${displayName} - ${member.sent} pesan\n`;
        });
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
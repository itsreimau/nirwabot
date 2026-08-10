module.exports = {
    name: "menu",
    aliases: ["allmenu", "help"],
    category: "main",
    code: async (ctx) => {
        try {
            const {
                cmd
            } = ctx.bot;
            const tag = {
                ai: "Artificial Intelligence",
                converter: "Converter",
                downloader: "Downloader",
                game: "Game",
                group: "Group",
                maker: "Maker",
                profile: "Profile",
                search: "Search",
                tool: "Tool",
                owner: "Owner",
                information: "Information",
                misc: "Miscellaneous"
            };

            const getCommands = (categories) => {
                const result = {};
                const allCmds = Array.from(cmd.values());
                categories.forEach(cat => {
                    const filtered = allCmds.filter(c => c.category === cat).map(c => ({
                        name: c.name,
                        permissions: c.permissions || {}
                    })).sort((a, b) => a.name.localeCompare(b.name));
                    if (filtered.length > 0) result[cat] = filtered;
                });
                return result;
            };

            const formatPerms = (perms) => {
                let format = "";
                if (perms.coin) format += `ⓒ`;
                if (perms.group) format += "Ⓖ";
                if (perms.owner) format += "Ⓞ";
                if (perms.premium) format += "Ⓟ";
                if (perms.private) format += "ⓟ";
                return format;
            };

            const input = ctx.args[0]?.toLowerCase();
            if (input || ctx.used.command === "allmenu") {
                const selectedCats = input === "all" || ctx.used.command === "allmenu" ? Object.keys(tag) : (tag[input] ? [input] : []);
                const commandsData = getCommands(selectedCats);
                if (Object.keys(commandsData).length === 0) return await ctx.reply(ctx.format.info("Menu tidak ditemukan!"));

                let text = "";
                for (const [key, list] of Object.entries(commandsData)) {
                    text += "╭┈┈┈┈┈┈ ♡\n" +
                        `┊ ✦ — ${ctx.format.bold(tag[key] || key)}\n`;
                    list.forEach(c => {
                        text += `┊ ❖ ${ctx.used.prefix + c.name} ${formatPerms(c.permissions)}\n`;
                    });
                    text += "╰┈┈┈┈┈┈\n\n";
                }
                text += `ⓒ = coin | Ⓖ = grup | Ⓞ = owner | Ⓟ = premium | ⓟ = private\n`;

                const thumbnailText = input === "all" || ctx.used.command === "allmenu" ? "All Menu" : (input && tag[input] ? tag[input] : "Menu");
                const thumbnail = await ctx.helper.getJpegThumbnail(config.bot.thumbnail);
                await ctx.reply({
                    caption: text,
                    location: {
                        degreesLatitude: 0,
                        degreesLongitude: 0,
                        name: config.bot.name,
                        address: "Jangan lupa berdonasi agar bot tetap online.",
                        jpegThumbnail: thumbnail
                    },
                    buttons: [{
                        text: "Hubungi Owner",
                        id: `${ctx.used.prefix}owner`
                    }, {
                        text: "Donasi",
                        id: `${ctx.used.prefix}donate`
                    }]
                });
            } else {
                const userDb = ctx.db.user;
                const groups = Object.values(await ctx.core.groupFetchAllParticipating()).filter(g => !g.announce && !g.isCommunity && !g.isCommunityAnnounce);
                const text = `✦ — Halo, @${ctx.getId(ctx.sender.jid)}! Saya adalah bot WhatsApp bernama ${config.bot.name}, dimiliki oleh ${config.owner.name}.\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Status")}: ${ctx.sender.isOwner() ? "Owner" : (userDb?.premium ? `Premium (${userDb?.premiumExpiration ? `${ctx.format.convertMsToDuration(userDb.premiumExpiration - Date.now(), ["hari", "jam"])} tersisa` : "Selamanya"})` : "Freemium")}\n` +
                    `❖ ${ctx.format.bold("Level")}: ${userDb?.level || 0} (${userDb?.xp || 0}/100)\n` +
                    `❖ ${ctx.format.bold("Koin")}: ${ctx.sender.isOwner() || userDb?.premium ? "Unlimited" : (userDb?.coin || 0)}\n` +
                    "\n" +
                    `❖ ${ctx.format.bold("Mode")}: ${ctx.format.ucwords(ctx.db.bot?.mode || "public")}\n` +
                    `❖ ${ctx.format.bold("Uptime")}: ${ctx.format.convertMsToDuration(Date.now() - ctx.me.readyAt)}\n` +
                    `❖ ${ctx.format.bold("Database")}: ${ctx.db.users.totalEntries} users, ${ctx.db.groups.totalEntries}/${groups.length} groups\n` +
                    `❖ ${ctx.format.bold("Library")}: Baileys (${ctx.helper.getBaileysVersion()})\n` +
                    "\n" +
                    `✧ ${ctx.format.italic("Jangan lupa berdonasi agar bot tetap online.")}`;

                const rows = Object.keys(tag).map(category => ({
                    title: tag[category],
                    description: `Klik untuk melihat perintah ${tag[category]}`,
                    id: `${ctx.used.prefix + ctx.used.command} ${category}`
                }));
                rows.unshift({
                    title: "Semua Kategori",
                    description: "Klik untuk melihat semua perintah sekaligus",
                    id: `${ctx.used.prefix + ctx.used.command} all`
                });

                await ctx.reply({
                    image: {
                        url: config.bot.thumbnail
                    },
                    caption: text,
                    mentions: [ctx.sender.jid],
                    footer: config.msg.footer,
                    optionText: "Opsi",
                    optionTitle: "Pilih Opsi",
                    offerText: config.bot.name,
                    offerCode: config.system.customPairingCode,
                    offerUrl: config.bot.groupLink,
                    offerExpiration: Date.now() + 2592000000,
                    nativeFlow: [{
                        text: "Daftar Menu",
                        sections: [{
                            title: "Pilih Kategori Menu",
                            highlight_label: "🌕",
                            rows
                        }]
                    }, {
                        text: "Hubungi Owner",
                        id: `${ctx.used.prefix}owner`
                    }, {
                        text: "Donasi",
                        id: `${ctx.used.prefix}donate`
                    }]
                });
            }
        } catch (error) {
            await ctx.helper.handleError(ctx, error);
        }
    }
};
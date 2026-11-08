const Baileys = require("baileys");
const config = require("../runtime/config");
const vCard = require("vcard-parser");
const WASF = require("wa-sticker-formatter");

class ClientMedia {
    async _createSendMessage(jid, content, options = {}) {
        if (typeof content === "string")
            content = {
                text: content
            };
        content = await this._processContacts(content);
        content = await this._processSticker(content, options);
        content = await this._processStickerPack(content, options);
        if (Baileys.isPnUser(jid) || Baileys.isLidUser(jid)) content.ai = true;
        return await this.core.sendMessage(jid, content, options);
    }

    async _processContacts(content) {
        if (!content?.contacts) return content;
        const contacts = Array.isArray(content.contacts) ? content.contacts : content.contacts?.contacts || [content.contacts];
        const parsed = contacts.map(contact => {
            if (contact.vcard) return contact;
            if (!contact.number) return null;
            const clean = contact.number.toString().replace(/\s/g, "");
            const vcard = vCard.generate({
                version: [{
                    value: "3.0"
                }],
                fn: [{
                    value: contact.displayName || "nirwabot"
                }],
                org: [{
                    value: [contact.org || ""]
                }],
                tel: [{
                    value: `+${clean}`,
                    meta: {
                        type: ["CELL", "VOICE"],
                        waid: [clean]
                    }
                }]
            });
            return {
                displayName: contact.displayName || "nirwabot",
                vcard
            };
        }).filter(Boolean);
        if (!parsed.length) return content;
        return {
            contacts: Array.isArray(content.contacts) && !content.contacts?.contacts ? {
                displayName: "nirwabot",
                contacts: parsed
            } : {
                displayName: content.contacts?.displayName || "nirwabot",
                contacts: parsed
            }
        };
    }

    async _processSticker(content, options) {
        if (!content?.sticker) return content;
        const buffer = Buffer.isBuffer(content.sticker) ? content.sticker : content.sticker?.url;
        if (!buffer) return content;
        const {
            background,
            pack = config.sticker.packname,
            author = config.sticker.author,
            type = WASF.StickerTypes.FULL,
            categories = ["🌕"],
            id = Date.now().toString(),
            quality = 50,
            ...rest
        } = options;
        return {
            sticker: await new WASF.Sticker(buffer, {
                pack,
                author,
                type,
                categories,
                id,
                quality,
                background
            }).build(),
            ...rest
        };
    }

    async _processStickerPack(content, options) {
        if (!content?.stickerPack) return content;
        const {
            stickers,
            name = "Sticker Pack",
            publisher = config.bot.name,
            description = "",
            cover,
            ...rest
        } = content.stickerPack;
        delete content.stickerPack;
        const processed = await Promise.all(stickers.map(async (sticker, index) => {
            const buffer = await new WASF.Sticker(sticker.data, {
                pack: options.pack || config.sticker.packname,
                author: options.author || config.sticker.author,
                type: options.type || WASF.StickerTypes.FULL,
                categories: options.categories || ["🌕"],
                id: sticker.id || `${Date.now()}-${index}`,
                quality: options.quality || 50,
                ...sticker
            }).build();
            return {
                data: buffer,
                emojis: sticker.emojis || ["🌕"],
                isCover: index === 0 && !cover
            };
        }));
        return {
            name,
            publisher,
            description,
            cover: processed[0].data,
            stickers: processed.map(sticker => ({
                data: sticker.data,
                emojis: sticker.emojis
            })),
            ...rest
        };
    }
}

module.exports = ClientMedia;
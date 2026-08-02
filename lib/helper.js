const Baileys = require("baileys");
const didYouMean = require("didyoumean");
const vCard = require("vcard-parser");
const crypto = require("node:crypto");
const util = require("node:util");

function calculateDelay(totalTargets) {
    if (!totalTargets || totalTargets <= 0) return null;

    const getBaseDelay = (total) => {
        if (total <= 5) return 5000;
        if (total <= 15) return 10000;
        if (total <= 30) return 20000;
        return 30000;
    };

    const delays = Array.from({
        length: totalTargets
    }, () => {
        const baseDelay = getBaseDelay(totalTargets);
        const randomRange = baseDelay;
        let delay = baseDelay + Math.random() * randomRange;
        delay *= 0.8 + Math.random() * 0.8;
        return Math.floor(delay);
    });

    const totalDuration = delays.reduce((sum, d) => sum + d, 0);
    return {
        delay: delays,
        duration: totalDuration
    };
}

function calculateDimensions(width, height) {
    const maxSize = 640;
    if (width <= maxSize && height <= maxSize)
        return {
            width,
            height
        };
    const ratio = Math.min(maxSize / width, maxSize / height);
    return {
        width: Math.round(width * ratio),
        height: Math.round(height * ratio)
    };
}

function checkOwner(jid, owner, fromMe) {
    if (!Baileys.isPnUser(jid)) return false;
    return fromMe || owner.some(o => Baileys.areJidsSameUser(o + Baileys.S_WHATSAPP_NET, jid));
}

function extractUrlFromText(text) {
    if (!text) return null;
    return Baileys.extractUrlFromText(text) || null;
}

function getBaileysVersion() {
    const version = require("../package.json").dependencies?.baileys;
    return version.replace(/^[a-zA-Z]+:|\/\/[^/]+\//, "").replace(/^[~^>=<]/, "").split(/[#@]/)[0].replace(/\.git$/, "");
}

function getBodyFromMsg(msg) {
    const BODY_HANDLERS = {
        conversation: (message) => message.conversation || "",
        extendedTextMessage: (message) => message.extendedTextMessage?.text || "",
        imageMessage: (message) => message.imageMessage?.caption || "",
        videoMessage: (message) => message.videoMessage?.caption || "",
        documentMessageWithCaption: (message) => message.documentMessageWithCaption?.caption || "",
        protocolMessage: (message) =>
            getBodyFromMsg({
                message: message.protocolMessage?.editedMessage || ""
            }),
        buttonsMessage: (message) => message.buttonsMessage?.contentText || "",
        interactiveMessage: (message) => message.interactiveMessage?.body?.text || "",
        buttonsResponseMessage: (message) => message.buttonsResponseMessage?.selectedButtonId || "",
        listResponseMessage: (message) => message.listResponseMessage?.singleSelectReply?.selectedRowId || "",
        templateButtonReplyMessage: (message) => message.templateButtonReplyMessage?.selectedId || "",
        interactiveResponseMessage: (message) => message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ? JSON.parse(message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)?.id || "" : ""
    };
    return BODY_HANDLERS[Baileys.getContentType(msg.message)]?.(msg.message);
}

function getDb(collection, jid) {
    const ensureCollection = (collection, jid, isMatch) => {
        if (!collection.has(isMatch))
            collection.create({
                jid
            });
        return collection.get(isMatch);
    };

    if (collection.name === "bot") return ensureCollection(collection, "bot", bot => bot.jid === "bot");
    if (collection.name === "users" && Baileys.isLidUser(jid)) return ensureCollection(collection, jid, (user) => Baileys.areJidsSameUser(user.jid, jid));
    if (collection.name === "groups" && Baileys.isJidGroup(jid)) return ensureCollection(collection, jid, (group) => Baileys.areJidsSameUser(group.jid, jid));
    return null;
}

function getId(jid) {
    return Baileys.jidDecode(jid)?.user || jid;
}

async function getJpegThumbnail(url) {
    const stream = await Baileys.getHttpStream(url);
    const result = await Baileys.extractImageThumb(stream, 300);
    return result.buffer;
}

function getMessageType(message) {
    return Baileys.getContentType(Baileys.extractMessageContent(message));
}

function getPushName(jid, db) {
    if (!Baileys.isLidUser(jid)) return "Unknown";
    const users = db.getCollection("users");
    return getDb(users, jid)?.pushName || "Unknown";
}

function getRandomElement(array) {
    if (!array || !Array.isArray(array) || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

function getReportOwner() {
    const owners = [];
    if (config.owner.report) owners.push(config.owner.id);
    if (config.owner.co && Array.isArray(config.owner.co))
        config.owner.co.forEach(co => {
            if (co.report) owners.push(co.id);
        });
    return owners.length > 0 ? owners : false;
}

async function handleError(ctx, error, useAxios = false, silent = false) {
    const isGroup = ctx.isGroup();
    const senderJid = ctx.sender.jid;
    const senderId = ctx.getId(senderJid);
    const groupJid = isGroup ? ctx.id : null;
    const groupSubject = isGroup ? await ctx.group(groupJid).name() : null;
    const errorText = util.format(error);
    const isOwner = ctx.sender.isOwner();

    console.error(util.styleText("red", "[x]"), `Error: ${util.format(errorText)}`);

    if (isOwner)
        return await ctx.reply(
            `${ctx.format.info("Terjadi kesalahan:")}\n` +
            ctx.format.monospace(errorText)
        );
    if (silent || !config.system.restrict) {
        const reportOwner = getReportOwner();
        if (reportOwner && reportOwner.length > 0) {
            const {
                delay
            } = calculateDelay(reportOwner.length);
            for (const ownerId of reportOwner) {
                await ctx.replyWithJid(ownerId + Baileys.S_WHATSAPP_NET, {
                    text: `${isGroup ? `Terjadi kesalahan dari grup: @${groupJid}, oleh: @${senderId}` : `Terjadi kesalahan dari: @${senderId}`}\n` +
                        ctx.format.monospace(errorText),
                    contextInfo: {
                        mentionedJid: [senderJid],
                        groupMentions: isGroup ? [{
                            groupJid,
                            groupSubject
                        }] : []
                    }
                });
                await Baileys.delay(delay);
            }
        }
    }
    await ctx.reply(ctx.format.info(useAxios && error.status !== 200 ? config.msg.notFound : config.msg.error));
}

function isUrl(url) {
    if (!url) return false;
    return /(https?:\/\/[^\s]+)/g.test(url);
}

function parseCommand(prefix, body) {
    if (!body)
        return {
            command: null,
            args: [],
            commandName: null,
            text: null,
            selectedPrefix: null
        };

    let selectedPrefix = null;
    if (Array.isArray(prefix)) {
        const prefixes = prefix.includes("") ? [...prefix.filter(p => p !== ""), ""] : prefix;
        selectedPrefix = prefixes.find(pref => body.startsWith(pref));
    } else if (prefix instanceof RegExp) {
        const match = body.match(prefix);
        selectedPrefix = match ? match[0] : null;
    } else if (typeof prefix === "string") {
        selectedPrefix = body.startsWith(prefix) ? prefix : null;
    }

    if (!selectedPrefix)
        return {
            command: null,
            args: [],
            commandName: null,
            text: null,
            selectedPrefix: null
        };

    const command = body.slice(selectedPrefix.length).trim();
    const parts = command.split(/\s+/);
    const commandName = parts.shift()?.toLowerCase();
    const text = command.slice(commandName.length).trimStart();

    return {
        command,
        args: parts,
        commandName,
        text,
        selectedPrefix
    };
}

function parseContact(contact) {
    if (contact.vcard)
        return {
            displayName: contact.displayName || "nirwabot",
            vcard: contact.vcard
        };
    if (contact.number) {
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
    }
    return null;
}

module.exports = {
    areJidsSameUser: Baileys.areJidsSameUser,
    calculateDelay,
    calculateDimensions,
    checkOwner,
    delay: Baileys.delay,
    didYouMean,
    extractUrlFromText,
    getBaileysVersion,
    getBodyFromMsg,
    getDb,
    getId,
    getJpegThumbnail,
    getMessageType,
    getPushName,
    getRandomElement,
    getReportOwner,
    handleError,
    isUrl,
    parseCommand,
    parseContact,
    randomUUID: crypto.randomUUID
};
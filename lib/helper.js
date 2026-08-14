const Baileys = require("baileys");
const didYouMean = require("didyoumean");
const crypto = require("node:crypto");
const util = require("node:util");

function calculateDelays(totalTargets) {
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
        delays,
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
    const message = Baileys.extractMessageContent(msg.message);
    const BODY_HANDLERS = {
        conversation: (message) => message.conversation || "",
        extendedTextMessage: (message) => message.extendedTextMessage?.text || "",
        imageMessage: (message) => message.imageMessage?.caption || "",
        videoMessage: (message) => message.videoMessage?.caption || "",
        documentMessage: (message) => message.documentMessage?.caption || "",
        locationMessage: (message) => message.locationMessage?.comment || "",
        liveLocationMessage: (message) => message.liveLocationMessage?.caption || "",
        productMessage: (message) => message.productMessage?.body || "",
        orderMessage: (message) => message.orderMessage?.message || "",
        invoiceMessage: (message) => message.invoiceMessage?.note || "",
        groupInviteMessage: (message) => message.groupInviteMessage?.caption || "",
        listMessage: (message) => message.listMessage.description || "",
        interactiveMessage: (message) => message.interactiveMessage?.body?.text || "",
        buttonsResponseMessage: (message) => message.buttonsResponseMessage?.selectedButtonId || "",
        listResponseMessage: (message) => message.listResponseMessage?.singleSelectReply?.selectedRowId || "",
        templateButtonReplyMessage: (message) => message.templateButtonReplyMessage?.selectedId || "",
        interactiveResponseMessage: (message) => message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ? JSON.parse(message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)?.id || "" : ""
    };
    return BODY_HANDLERS[Baileys.getContentType(message)]?.(message);
}

function getDb(collection, jid) {
    const ensureCollection = (collection, jid, isMatch) => {
        if (!collection.has(isMatch))
            collection.create({
                jid
            });
        return collection.get(isMatch);
    };

    if (collection.name === "bot") return ensureCollection(collection, "bot", (bot) => bot.jid === "bot");
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

function getReportOwners() {
    const owners = [];
    if (config.owner.report) owners.push(config.owner.id);
    if (config.owner.co && Array.isArray(config.owner.co))
        config.owner.co.forEach(co => {
            if (co.report) owners.push(co.id);
        });
    return owners || false;
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
        const reportOwners = getReportOwners();
        if (reportOwners && reportOwners.length > 0) {
            const {
                delays
            } = calculateDelays(reportOwners.length);
            for (let i = 0; i < reportOwners.length; i++) {
                await ctx.replyWithJid(reportOwners[i] + Baileys.S_WHATSAPP_NET, {
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
                await Baileys.delay(delays[i]);
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

module.exports = {
    areJidsSameUser: Baileys.areJidsSameUser,
    calculateDelays,
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
    getReportOwners,
    handleError,
    isUrl,
    parseCommand,
    randomUUID: crypto.randomUUID
};

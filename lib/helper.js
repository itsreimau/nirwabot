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
        const base = getBaseDelay(totalTargets);
        const range = base;
        let delay = base + Math.random() * range;
        delay *= 0.8 + Math.random() * 0.8;
        return Math.floor(delay);
    });
    return {
        delays,
        duration: delays.reduce((a, b) => a + b, 0)
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
    if (!Baileys.isLidUser(jid) && !Baileys.isPnUser(jid)) return false;
    return fromMe || owner.some(o => Baileys.areJidsSameUser(o, jid));
}

function extractUrlFromText(text) {
    if (!text) return null;
    return Baileys.extractUrlFromText(text) || null;
}

function getBaileysVersion() {
    const version = require("../package.json").dependencies.baileys || "";
    return version.replace(/^[a-zA-Z]+:|\/\/[^/]+\//, "").replace(/^[~^>=<]/, "").split(/[#@]/)[0].replace(/\.git$/, "");
}

function getBodyFromMsg(msg) {
    let message = Baileys.extractMessageContent(msg.message);
    if (message?.conversation) return message.conversation;
    const contentType = Baileys.getContentType(message);
    if (!contentType) return "";
    message = message[contentType];
    if (message?.nativeFlowResponseMessage) {
        try {
            const params = JSON.parse(message.nativeFlowResponseMessage.paramsJson || "{}");
            return params?.id || params?.display_text || "";
        } catch {}
    }
    return message.text || message.caption || message.selectedId || message.selectedButtonId || message.singleSelectReply?.selectedRowId || message.selectedDisplayText || message.body?.text || message.hydratedContentText || message.contentText || message.messageText || "";
}

function getDb(collection, id) {
    if (!collection) return null;
    const name = collection.name;
    if (name === "bot")
        return collection.getOrCreate(bot => bot.id === "bot", {
            id: "bot"
        });
    if (name === "users" && Baileys.isLidUser(id))
        return collection.getOrCreate(user => Baileys.areJidsSameUser(user.id, id), {
            id
        });
    if (name === "groups" && Baileys.isJidGroup(id))
        return collection.getOrCreate(group => Baileys.areJidsSameUser(group.id, id), {
            id
        });
    return null;
}

function getId(jid) {
    return Baileys.jidDecode(jid)?.user || jid;
}

async function getJpegThumbnail(url) {
    try {
        const stream = await Baileys.getHttpStream(url);
        return (await Baileys.extractImageThumb(stream, 300)).buffer;
    } catch {
        return null;
    }
}

function getMessageType(message) {
    message = Baileys.extractMessageContent(message);
    return Baileys.getContentType(message?.header || message);
}

function getPushName(jid, db) {
    if (!Baileys.isLidUser(jid)) return "Unknown";
    return getDb(db.getCollection("users"), jid)?.pushName || "Unknown";
}

function getRandomElement(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}


function getReportOwners() {
    const owners = config.owner.report ? [config.owner.id] : [];
    config.owner.co?.forEach(co => {
        if (co.report) owners.push(co.id);
    });
    return owners.map(owner => owner.find(Baileys.isLidUser) || owner.find(Baileys.isPnUser));
}

async function handleError(ctx, error, useAxios = false, silent = false) {
    const isGroup = ctx.isGroup();
    const senderJid = ctx.sender.jid;
    const senderId = ctx.getId(senderJid);
    const groupJid = isGroup ? ctx.id : null;
    const groupSubject = isGroup ? await ctx.group(groupJid).name() : null;
    const errorText = util.format(error);
    const isOwner = ctx.sender.isOwner();

    console.error(util.styleText("red", "[x]"), `Error: ${errorText}`);
    if (isOwner)
        return await ctx.reply(
            `${ctx.format.info("Terjadi kesalahan:")}\n` +
            ctx.format.monospace(errorText)
        );
    if (silent || !config.system.restrict) {
        const reportOwners = getReportOwners();
        if (reportOwners && reportOwners.length) {
            const {
                delays
            } = calculateDelays(reportOwners.length);
            for (let i = 0; i < reportOwners.length; i++) {
                await ctx.replyWithJid(reportOwners[i], {
                    text: `${isGroup ? `Terjadi kesalahan dari grup: @${groupJid} — oleh: @${senderId}` : `Terjadi kesalahan dari: @${senderId}`}\n` +
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
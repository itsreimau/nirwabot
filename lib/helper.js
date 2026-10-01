const Baileys = require("baileys");
const didYouMean = require("didyoumean");
const crypto = require("node:crypto");
const util = require("node:util");

const checkOwner = (jid, owner, fromMe) => (Baileys.isLidUser(jid) || Baileys.isPnUser(jid)) && (fromMe || owner.some(o => Baileys.areJidsSameUser(o, jid)));
const extractUrlFromText = (text) => text ? (Baileys.extractUrlFromText(text) || null) : null;
const getBaileysVersion = () => require("../package.json").dependencies.baileys.replace(/^[a-zA-Z]+:|\/\/[^/]+\//, "").replace(/^[~^>=<]/, "").split(/[#@]/)[0].replace(/\.git$/, "");
const getId = (jid) => Baileys.jidDecode(jid)?.user || jid;
const getPushName = (jid, db) => Baileys.isLidUser(jid) ? (getDb(db.getCollection("users"), jid)?.pushName || "Unknown") : "Unknown";
const getRandomElement = (array) => Array.isArray(array) && array.length ? array[Math.floor(Math.random() * array.length)] : null;
const isUrl = (url) => url ? /(https?:\/\/[^\s]+)/g.test(url) : false;

function calculateDelays(totalTargets) {
    if (!totalTargets || totalTargets <= 0) return null;
    const base = totalTargets <= 5 ? 5000 : totalTargets <= 15 ? 10000 : totalTargets <= 30 ? 20000 : 30000;
    const delays = Array.from({
        length: totalTargets
    }, () => {
        let delay = base + Math.random() * base;
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

function getReportOwners() {
    const owners = config.owner.report ? [config.owner.id] : [];
    config.owner.co?.forEach(co => co.report && owners.push(co.id));
    return owners.map(o => o.find(Baileys.isLidUser) || o.find(Baileys.isPnUser));
}

async function reportError(ctx, error, useAxios = false, silent = false) {
    const isGroup = ctx.isGroup();
    const senderJid = ctx.sender.jid;
    const senderId = ctx.getId(senderJid);
    const groupJid = isGroup ? ctx.id : null;
    const groupSubject = isGroup ? await ctx.group(groupJid).name() : null;
    const errorText = util.format(error);

    console.error(util.styleText("red", "[x]"), `Error: ${errorText}`);
    if (ctx.sender.isOwner())
        return await ctx.reply(
            `${ctx.format.info("Terjadi kesalahan:")}\n` +
            ctx.format.monospace(errorText)
        );
    if (silent || !config.system.restrict) {
        const reportOwners = getReportOwners();
        if (reportOwners?.length) {
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

function parseCommand(prefix, body) {
    const empty = {
        command: null,
        args: [],
        commandName: null,
        text: null,
        selectedPrefix: null
    };
    if (!body) return empty;
    let selectedPrefix = null;
    if (Array.isArray(prefix)) {
        const prefixes = prefix.includes("") ? [...prefix.filter(p => p !== ""), ""] : prefix;
        selectedPrefix = prefixes.find(pref => body.startsWith(pref));
    } else if (prefix instanceof RegExp) {
        selectedPrefix = body.match(prefix)?.[0] || null;
    } else if (typeof prefix === "string") {
        selectedPrefix = body.startsWith(prefix) ? prefix : null;
    }
    if (!selectedPrefix) return empty;
    const command = body.slice(selectedPrefix.length).trim();
    const parts = command.split(/\s+/);
    const commandName = parts.shift()?.toLowerCase();
    return {
        command,
        args: parts,
        commandName,
        text: command.slice(commandName.length).trimStart(),
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
    reportError,
    isUrl,
    parseCommand,
    randomUUID: crypto.randomUUID
};
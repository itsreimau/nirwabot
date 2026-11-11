const moment = require("moment-timezone");

const bold = (text) => `*${text}*`;
const info = (text) => `ⓘ ${italic(text)}`;
const inlineCode = (text) => `\`${text}\``;
const italic = (text) => `_${text}_`;
const monospace = (text) => `\`\`\`${text}\`\`\``;
const quote = (text) => `> ${text}`;
const strikethrough = (text) => `~${text}~`;
const ucwords = (text) => text ? text.toLowerCase().replace(/\b\w/g, (txt) => txt.toUpperCase()) : null;

function convertMsToDuration(ms, requestedParts = null) {
    if (!ms || ms <= 0) return "0 detik";
    const duration = moment.duration(ms);
    const hasLargerUnits = duration.asSeconds() >= 1;
    const units = {
        tahun: duration.years(),
        bulan: duration.months(),
        minggu: duration.weeks(),
        hari: duration.days(),
        jam: duration.hours(),
        menit: duration.minutes(),
        detik: duration.seconds(),
        milidetik: duration.milliseconds()
    };
    const parts = [];
    if (requestedParts?.length) {
        for (const part of requestedParts) {
            if (part in units) parts.push(`${units[part]} ${part}`);
        }
    } else {
        for (const [unit, value] of Object.entries(units)) {
            if (unit === "milidetik") {
                if (!hasLargerUnits && value > 0) parts.push(`${value} ${unit}`);
            } else if (value > 0) {
                parts.push(`${value} ${unit}`);
            }
        }
    }
    return parts.length ? parts.join(" ") : "0 detik";
}

function formatSize(byteCount, withPerSecond = false) {
    if (!byteCount) return `0 yBytes${withPerSecond ? "/s" : ""}`;
    let index = 8;
    let size = byteCount;
    const bytes = ["yBytes", "zBytes", "aBytes", "fBytes", "pBytes", "nBytes", "µBytes", "mBytes", "Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    while (size < 1 && index > 0) {
        size *= 1024;
        index--;
    }
    while (size >= 1024 && index < bytes.length - 1) {
        size /= 1024;
        index++;
    }
    return `${size.toFixed(2)} ${bytes[index]}${withPerSecond ? "/s" : ""}`;
}

function generateCmdExample(used, args) {
    if (!used || !args) return "Argumen tidak lengkap.";
    return `Contoh: ${inlineCode(`${used.prefix + used.command} ${args}`)}`;
}

function generateInstruction(actions, mediaTypes) {
    if (!actions?.length || !mediaTypes?.length) return "Argumen tidak valid.";
    const translations = {
        audio: "audio",
        document: "dokumen",
        image: "gambar",
        sticker: "stiker",
        text: "teks",
        video: "video",
        viewOnce: "sekali lihat"
    };
    const list = mediaTypes.map(type => translations[type]);
    const mediaTypesList = list.length > 1 ? `${list.slice(0, -1).join(", ")} atau ${list.at(-1)}` : list[0];
    const actionTranslations = {
        send: "Kirim",
        reply: "Balas"
    };
    const actionList = actions.map(action => actionTranslations[action]).join(actions.length > 1 ? "/" : "");
    return info(`${actionList} ${mediaTypesList}.`);
}

function generatesFlagInfo(flags) {
    if (!flags || typeof flags !== "object") return "Flag tidak valid.";
    return "Flag:\n" +
        Object.entries(flags).map(([flag, description]) => `- ${inlineCode(flag)}: ${description}`).join("\n");
}

function generateNotes(notes) {
    if (!notes?.length) return "Catatan tidak valid.";
    return "Catatan:\n" +
        notes.map(note => `- ${note}`).join("\n");
}

module.exports = {
    bold,
    convertMsToDuration,
    formatSize,
    generateCmdExample,
    generateInstruction,
    generatesFlagInfo,
    generateNotes,
    info,
    inlineCode,
    italic,
    monospace,
    quote,
    strikethrough,
    ucwords
};
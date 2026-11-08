#!/usr/bin/env node

const logger = require("../src/utils/logger");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const get = (f, d) => {
    const i = argv.indexOf(f);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};

const HELP = "Database cleaner for nirwabot.\n" +
    "\n" +
    "Usage: node scripts/clean.js <mode> [options]\n" +
    "\n" +
    "Modes:\n" +
    "  --all       users + expired + groups + bot\n" +
    "  --expired   expired flags, stale cache, stale cooldowns\n" +
    "  --users     banned users, expired premium, reset ticket/score\n" +
    "  --groups    expired sewa/mute, warnings > max, stale spam, reset members\n" +
    "  --bot       reset bot collection (keeps __id)\n" +
    "\n" +
    "Options:\n" +
    "  --dry-run   Print actions without writing\n" +
    "  --yes       Skip confirmation\n" +
    "  --verbose   Print each change\n" +
    "  --db <dir>  Database folder (default: ./database)\n" +
    "\n" +
    "Examples:\n" +
    "  node scripts/clean.js --all --dry-run --verbose\n" +
    "  node scripts/clean.js --all --yes\n" +
    "  node scripts/clean.js --expired --yes --db database.bak";

if (has("--help") || has("-h") || argv.length === 0) {
    console.log(HELP);
    process.exit(argv.length === 0 ? 1 : 0);
}

const DRY = has("--dry-run");
const YES = has("--yes");
const VERBOSE = has("--verbose");
const MODE = {
    all: has("--all"),
    expired: has("--expired") || has("--all"),
    users: has("--users") || has("--all"),
    groups: has("--groups") || has("--all"),
    bot: has("--bot") || has("--all")
};
if (!Object.values(MODE).some(Boolean)) {
    logger.error("No mode selected.");
    process.exit(1);
}

const DB_DIR = path.resolve(__dirname, "..", get("--db", "database"));
const FILES = {
    users: path.join(DB_DIR, "users.json"),
    groups: path.join(DB_DIR, "groups.json"),
    bot: path.join(DB_DIR, "bot.json")
};

const s = {
    files: 0,
    corrupt: 0,
    missing: 0,
    removed: 0,
    merged: 0,
    fixed: 0,
    uuid: 0,
    dropped: 0,
    actions: 0
};
const log = (msg) => VERBOSE && logger.info(msg);

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string";
const isNum = (v) => Number.isFinite(v);
const isArr = Array.isArray;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (v) => isStr(v) && UUID_RE.test(v);
const newUuid = () => crypto.randomUUID();
const isUserJid = (v) => isStr(v) && /^\d{6,20}@(s\.whatsapp\.net|lid)$/i.test(v);
const isGroupJid = (v) => isStr(v) && /^\d{6,20}@g\.us$/i.test(v);
const isBotId = (v) => v === "bot";

const merge = (a, b) => {
    if (!isObj(a) || !isObj(b)) return b ?? a;
    const out = {
        ...a
    };
    for (const [k, v] of Object.entries(b)) {
        if (!(k in out)) {
            out[k] = v;
            continue;
        }
        const cur = out[k];
        if (isArr(cur) && isArr(v)) {
            const m = new Map();
            for (const x of [...cur, ...v]) {
                const key = isObj(x) && x.id ? x.id : JSON.stringify(x);
                m.set(key, isObj(m.get(key)) && isObj(x) ? merge(m.get(key), x) : x);
            }
            out[k] = [...m.values()];
        } else if (isObj(cur) && isObj(v)) {
            out[k] = merge(cur, v);
        } else if (v !== undefined && v !== null && v !== "") {
            out[k] = v;
        }
    }
    return out;
};

const read = (file, kind) => {
    if (!fs.existsSync(file)) {
        s.missing++;
        return null;
    }
    try {
        const data = JSON.parse(fs.readFileSync(file, "utf8") || "[]");
        return isArr(data) ? data : [];
    } catch {
        s.corrupt++;
        if (!DRY) fs.copyFileSync(file, `${file}.corrupt-${Date.now()}.bak`);
        return [];
    }
};

const write = (file, data) => {
    if (DRY) return;
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
    fs.renameSync(tmp, file);
    s.files++;
};

function sanitize(records, kind, idOk) {
    const byId = new Map();
    const byUuid = new Map();

    for (const r of records) {
        if (!isObj(r) || !isStr(r.id) || !r.id.trim()) {
            s.removed++;
            log(`[remove] ${kind} — bad record`);
            continue;
        }
        const id = r.id.trim();
        if (!idOk(id)) {
            s.removed++;
            log(`[remove] ${kind}:${id} — invalid id`);
            continue;
        }

        let uuid = r.__id;
        if (!isUuid(uuid)) {
            uuid = newUuid();
            s.uuid++;
            log(`[uuid] ${kind}:${id} — regenerated`);
        } else if (byUuid.has(uuid) && byUuid.get(uuid) !== id) {
            uuid = newUuid();
            s.uuid++;
            log(`[uuid] ${kind}:${id} — duplicate`);
        }

        const clean = {
            id,
            __id: uuid
        };
        for (const [k, v] of Object.entries(r)) {
            if (k === "id" || k === "__id") continue;
            if (k.startsWith("__")) {
                s.dropped++;
                continue;
            }
            clean[k] = v;
        }

        if (byId.has(id)) {
            const merged = merge(byId.get(id), clean);
            merged.__id = byId.get(id).__id;
            byId.set(id, merged);
            s.merged++;
            log(`[merge] ${kind}:${id}`);
        } else {
            byId.set(id, clean);
            byUuid.set(uuid, id);
        }
    }
    return [...byId.values()];
}

const fixUser = (u) => {
    const b = JSON.stringify(u);
    u.pushName = isStr(u.pushName) && u.pushName ? u.pushName : "Unknown";
    u.ticket = isNum(u.ticket) ? Math.max(0, u.ticket) : 0;
    u.score = isNum(u.score) ? Math.max(0, u.score) : 0;
    u.premium = Boolean(u.premium);
    u.premiumExpiration = isNum(u.premiumExpiration) && u.premiumExpiration > 0 ? u.premiumExpiration : null;
    u.banned = Boolean(u.banned);
    u.afk = isObj(u.afk) && (u.afk.reason || u.afk.timestamp) ? u.afk : {};
    u.lastClaim = isNum(u.lastClaim) && u.lastClaim > 0 ? u.lastClaim : 0;
    u.sessionId = isObj(u.sessionId) ? u.sessionId : {};
    u.lastSentMsg = isObj(u.lastSentMsg) ? u.lastSentMsg : {};
    u.botGroupMembership = isObj(u.botGroupMembership) ? u.botGroupMembership : {};
    u.autodownload = Boolean(u.autodownload);
    if (JSON.stringify(u) !== b) s.fixed++;
    return u;
};

const fixGroup = (g) => {
    const b = JSON.stringify(g);
    const items = (v) => (isArr(v) ? v.filter(x => isObj(x) && isStr(x.id) && x.id) : []);
    g.members = items(g.members);
    g.mute = items(g.mute);
    g.warnings = items(g.warnings);
    g.spam = items(g.spam);
    g.maxwarnings = isNum(g.maxwarnings) && g.maxwarnings > 0 ? g.maxwarnings : 3;
    g.mutebot = Boolean(g.mutebot);
    g.option = isObj(g.option) ? g.option : {};
    g.text = isObj(g.text) ? g.text : {};
    g.sewa = Boolean(g.sewa);
    g.sewaExpiration = isNum(g.sewaExpiration) && g.sewaExpiration > 0 ? g.sewaExpiration : null;
    g.lastTopResetMonth = isStr(g.lastTopResetMonth) && /^\d{4}-\d{2}$/.test(g.lastTopResetMonth) ? g.lastTopResetMonth : null;
    if (JSON.stringify(g) !== b) s.fixed++;
    return g;
};

const fixBot = (b) => {
    const v = JSON.stringify(b);
    b.mode = ["premium", "group", "private", "public", "self"].includes(b.mode) ? b.mode : "public";
    b.restart = isObj(b.restart) ? b.restart : {};
    b.text = isObj(b.text) ? b.text : {};
    b.blacklistBroadcast = isArr(b.blacklistBroadcast) ? [...new Set(b.blacklistBroadcast.filter(isGroupJid))] : [];
    b.lastPrefix = isStr(b.lastPrefix) && b.lastPrefix ? b.lastPrefix : "/";
    if (JSON.stringify(b) !== v) s.fixed++;
    return b;
};

const cleanUsers = (users) => {
    const out = [];
    for (const u of users) {
        if (u.banned) {
            s.removed++;
            log(`[remove] user:${u.id} — banned`);
            continue;
        }
        if (MODE.users) {
            u.ticket = 0;
            u.score = 0;
        }
        if (u.premium && u.premiumExpiration && Date.now() >= u.premiumExpiration) {
            u.premium = false;
            u.premiumExpiration = null;
            s.fixed++;
        }
        out.push(fixUser(u));
    }
    return out;
};

const cleanExpired = (users) => {
    const cutoff = Date.now() - 864e5;
    for (const u of users) {
        if (u.botGroupMembership?.timestamp < cutoff) u.botGroupMembership = {};
        if (isObj(u.lastSentMsg)) {
            for (const k of Object.keys(u.lastSentMsg))
                if (!(u.lastSentMsg[k] > cutoff)) delete u.lastSentMsg[k];
        }
        if (!u.afk?.reason && !u.afk?.timestamp) u.afk = {};
    }
};

const cleanGroups = (groups) => {
    for (const g of groups) {
        if (g.sewa && g.sewaExpiration && Date.now() >= g.sewaExpiration) {
            g.sewa = false;
            g.sewaExpiration = null;
            s.fixed++;
        }
        g.mute = (g.mute || []).filter(m => !(m.expiration && Date.now() >= m.expiration));
        g.warnings = (g.warnings || []).filter(w => (w.count ?? 0) <= (g.maxwarnings ?? 3));
        g.spam = (g.spam || []).filter(x => (x.lastMessageTime ?? 0) >= Date.now() - 3e5);
        if ((g.members || []).some(m => (m.sent ?? 0) > 0)) {
            g.members = g.members.map(m => ({
                ...m,
                sent: 0
            }));
            s.fixed++;
        }
        fixGroup(g);
    }
};

const cleanBot = (arr) => {
    if (!arr.length) return arr;
    const b = arr[0];
    const __id = b.__id;
    Object.assign(b, {
        id: "bot",
        mode: "public",
        restart: {},
        text: {},
        blacklistBroadcast: [],
        lastPrefix: "/"
    });
    if (__id) b.__id = __id;
    fixBot(b);
    s.fixed++;
    return [b];
};

const confirm = () => {
    if (YES || DRY) return Promise.resolve(true);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(res => {
        rl.question(
            `Clean ${DB_DIR}\n` +
            `Modes: ${Object.keys(MODE).filter(k => MODE[k]).join(", ")}\n` +
            "Continue? (y/N) ", (a) => {
                rl.close();
                res(/^y(es)?$/i.test(a.trim()));
            }
        );
    });
};

(async () => {
    if (!(await confirm())) return logger.warn("Aborted.");

    logger.info(`Clean ${DB_DIR}${DRY ? " (dry)" : ""}`);

    if (MODE.users || MODE.all) {
        let u = read(FILES.users, "users");
        if (u) {
            u = sanitize(u, "users", isUserJid);
            u = cleanUsers(u);
            if (MODE.expired || MODE.all) cleanExpired(u);
            u = sanitize(u, "users", isUserJid);
            write(FILES.users, u);
        }
    }

    if (MODE.groups || MODE.all) {
        let g = read(FILES.groups, "groups");
        if (g) {
            g = sanitize(g, "groups", isGroupJid);
            cleanGroups(g);
            g = sanitize(g, "groups", isGroupJid);
            write(FILES.groups, g);
        }
    }

    if (MODE.bot || MODE.all) {
        let b = read(FILES.bot, "bot");
        if (b) write(FILES.bot, cleanBot(sanitize(b, "bot", isBotId)));
    }

    const summary = [`${s.files} files`, `${s.removed} removed`, `${s.merged} merged`, `${s.fixed} fixed`, `${s.uuid} uuid`, `${s.dropped} dropped`].join(" · ");

    if (s.actions === 0 && s.removed === 0 && s.merged === 0 && s.fixed === 0 && s.uuid === 0) {
        logger.success("Already clean.");
    } else if (DRY) {
        logger.info(`Dry: ${summary}`);
        logger.info("Run without --dry-run to apply.");
    } else {
        logger.success(`Done: ${summary}`);
    }
})().catch(e => {
    logger.error(e?.message || e);
    process.exitCode = 1;
});
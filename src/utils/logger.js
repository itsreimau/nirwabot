const util = require("node:util");

const LEVELS = {
    trace: {
        prefix: "[~]",
        color: "magenta",
        method: "log"
    },
    debug: {
        prefix: "[*]",
        color: null,
        method: "log"
    },
    info: {
        prefix: "[i]",
        color: "cyan",
        method: "log"
    },
    success: {
        prefix: "[+]",
        color: "green",
        method: "log"
    },
    ready: {
        prefix: "[>]",
        color: "blue",
        method: "log"
    },
    warn: {
        prefix: "[!]",
        color: "yellow",
        method: "warn"
    },
    error: {
        prefix: "[x]",
        color: "red",
        method: "error"
    }
};

const ORDER = {
    trace: 0,
    debug: 1,
    info: 2,
    success: 2,
    ready: 2,
    warn: 3,
    error: 4
};

const state = {
    minLevel: process.env.LOG_LEVEL in ORDER ? process.env.LOG_LEVEL : "trace",
    groupDepth: 0
};

function shouldLog(level) {
    return ORDER[level] >= ORDER[state.minLevel];
}

function formatPrefix(level) {
    const cfg = LEVELS[level];
    if (!cfg) return `[${level.toUpperCase()}]`;
    return cfg.color && util.styleText ? util.styleText(cfg.color, cfg.prefix) : cfg.prefix;
}

function indent() {
    return state.groupDepth > 0 ? "  ".repeat(state.groupDepth) : "";
}

function write(level, ...args) {
    if (!shouldLog(level)) return;
    const cfg = LEVELS[level] || {
        method: "log"
    };
    const fn = console[cfg.method] || console.log;
    fn(indent() + formatPrefix(level), ...args);
}

function group(...args) {
    if (!shouldLog("info")) return;
    console.group(indent() + formatPrefix("info"), ...args);
    state.groupDepth++;
}

function groupEnd() {
    if (state.groupDepth > 0) {
        state.groupDepth--;
        console.groupEnd();
    }
}

module.exports = {
    trace: (...a) => write("trace", ...a),
    debug: (...a) => write("debug", ...a),
    info: (...a) => write("info", ...a),
    success: (...a) => write("success", ...a),
    ready: (...a) => write("ready", ...a),
    warn: (...a) => write("warn", ...a),
    error: (...a) => write("error", ...a),

    group,
    groupEnd,

    setLevel(level) {
        if (level in ORDER) state.minLevel = level;
    },
    getLevel() {
        return state.minLevel;
    }
};
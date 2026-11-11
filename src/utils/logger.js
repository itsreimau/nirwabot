const util = require("node:util");

const styles = {
    info: "blue",
    success: "green",
    warn: "yellow",
    error: "red"
};

function write(level, ...args) {
    const prefix = `[${level.toUpperCase()}]`;
    const style = styles[level];
    const label = style && util.styleText ? util.styleText(style, prefix) : prefix;
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(label, ...args);
}

module.exports = {
    info: (...args) => write("info", ...args),
    success: (...args) => write("success", ...args),
    warn: (...args) => write("warn", ...args),
    error: (...args) => write("error", ...args)
};

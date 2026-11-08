const logger = require("../src/utils/logger");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const files = [];

function walk(dir) {
    for (const entry of fs.readdirSync(dir, {
            withFileTypes: true
        })) {
        if (["node_modules", ".git", "state", "database"].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && full.endsWith(".js")) files.push(full);
    }
}
walk(root);
let failed = false;
for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], {
        encoding: "utf8"
    });
    if (result.status !== 0) {
        failed = true;
        process.stderr.write(
            `${path.relative(root, file)}\n` +
            result.stderr
        );
    }
    const source = fs.readFileSync(file, "utf8");
    if (/global\.(?:config|bot)\b|Object\.assign\(global/.test(source)) {
        failed = true;
        logger.error(`Forbidden global runtime dependency found in ${path.relative(root, file)}`);
    }
}
if (failed) process.exit(1);
logger.success(`Checked ${files.length} JavaScript files: syntax OK; no global config/bot assignments.`);
const logger = require("../src/utils/logger");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const example = path.join(root, "config.example.json");
const target = path.join(root, "config.json");

if (!fs.existsSync(target)) {
    if (!fs.existsSync(example)) {
        logger.error("config.example.json not found");
        process.exit(1);
    }
    fs.copyFileSync(example, target);
    logger.success("config.json created from config.example.json");
} else {
    logger.info("config.json already exists; not overwritten");
}

if (!process.argv.includes("--skip-install")) {
    logger.info("Installing dependencies with npm...");
    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const result = spawnSync(command, ["install"], {
        cwd: root,
        stdio: "inherit",
        shell: process.platform === "win32"
    });
    if (result.error) {
        logger.error(`Failed to run npm install: ${result.error.message}`);
        throw result.error;
    }
    if (result.status !== 0) logger.error(`npm install exited with code ${result.status ?? 1}`);
    process.exitCode = result.status ?? 1;
}
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const example = path.join(root, "config.example.json");
const target = path.join(root, "config.json");
if (!fs.existsSync(target)) {
    if (!fs.existsSync(example)) throw new Error("config.example.json tidak ditemukan");
    fs.copyFileSync(example, target);
    console.log("[setup] config.json dibuat dari config.example.json");
} else {
    console.log("[setup] config.json sudah ada; tidak ditimpa");
}
if (!process.argv.includes("--skip-install")) {
    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const result = spawnSync(command, ["install"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
}

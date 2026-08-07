require("node:process").loadEnvFile();
const { Config } = require("./lib");
const http = require("node:http");
const path = require("node:path");
const util = require("node:util");
const cfonts = require("cfonts");
const pkg = require("./package.json");

Object.assign(global, {
    config: new Config(path.resolve(__dirname, "config.json"))
});

console.log("[*] Starting...");

cfonts.say(pkg.name, {
    colors: ["#00A1E0", "#00FFFF"],
    align: "center"
});
cfonts.say(`${pkg.description} - By ${pkg.author}`, {
    font: "console",
    colors: ["#E0F7FF"],
    align: "center"
});

if (config.system && config.system.useServer) {
    const port = config.system.port;
    http.createServer((_, res) => res.end(`${pkg.name} berjalan di port ${port}`)).listen(port, () => console.log(util.styleText("blue", "[>]"), `${pkg.name} runs on port ${port}`));
}

require("./main");
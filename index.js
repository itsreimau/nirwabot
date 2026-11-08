const config = require("./src/runtime/config");
const logger = require("./src/utils/logger");
const pkg = require("./package.json");
const http = require("node:http");
const cfonts = require("cfonts");

logger.info("Starting...");
cfonts.say(pkg.name, {
    colors: ["#00A1E0", "#00FFFF"],
    align: "center"
});
cfonts.say(`${pkg.description} - By ${pkg.author}`, {
    font: "console",
    colors: ["#E0F7FF"],
    align: "center"
});

if (config.system.useServer) {
    const port = config.system.port || 3000;
    http.createServer((_, res) => {
        res.writeHead(200, {
            "content-type": "text/plain; charset=utf-8"
        });
        res.end(`${pkg.name} berjalan di port ${port}`);
    }).listen(port, () => logger.info(`${pkg.name} runs on port ${port}`));
}

require("./src/main");
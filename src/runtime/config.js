const Config = require("../lib/config");
const validateConfig = require("../utils/validate-config");
const path = require("node:path");

const configPath = path.resolve(__dirname, "../../config.json");
const config = new Config(configPath);
validateConfig(config);

module.exports = config;
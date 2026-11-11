const config = require("../runtime/config.js");
const Messages = require("./messages");
const Ready = require("./ready");
const Welcome = require("./welcome");

module.exports = (bot) => {
    bot.ev.setMaxListeners(config.system.maxListeners || 50);
    Messages(bot);
    Ready(bot);
    Welcome(bot);
};
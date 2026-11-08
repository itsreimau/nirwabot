const Messages = require("./messages");
const Ready = require("./ready");
const Welcome = require("./welcome");
const config = require("../runtime/config.js");

module.exports = (bot) => {
    bot.ev.setMaxListeners(config.system.maxListeners || 50);
    Messages(bot);
    Ready(bot);
    Welcome(bot);
};
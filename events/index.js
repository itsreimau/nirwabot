const Call = require("./call");
const Messages = require("./messages");
const Ready = require("./ready");
const Welcome = require("./welcome");

module.exports = (bot) => {
    bot.ev.setMaxListeners(config.system.maxListeners || 50);
    Call(bot);
    Messages(bot);
    Ready(bot);
    Welcome(bot);
};
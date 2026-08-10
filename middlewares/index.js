const Check = require("./check");
const Permissions = require("./permissions");
const Restrictions = require("./restrictions");
const Track = require("./track");

module.exports = (bot) => {
    Check(bot);
    Permissions(bot);
    Restrictions(bot);
    Track(bot);
};
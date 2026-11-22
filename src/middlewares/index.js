const Check = require("./check");
const Validate = require("./validate");

module.exports = (bot) => {
    Check(bot);
    Validate(bot);
};
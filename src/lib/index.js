const { defineCommand, defineCommands } = require("./_factory");
const Client = require("./client");
const Config = require("./config");
const Cooldown = require("./cooldown");
const { CommandHandler } = require("./handler");

module.exports = {
    defineCommand,
    defineCommands,
    Client,
    Config,
    Cooldown,
    CommandHandler
};
const Client = require("./client");
const { CommandHandler } = require("./handler");
const Config = require("./config");
const Cooldown = require("./cooldown");
const { defineCommand, defineCommands } = require("./_factory");

module.exports = {
    Client,
    CommandHandler,
    Config,
    Cooldown,
    defineCommand,
    defineCommands
};
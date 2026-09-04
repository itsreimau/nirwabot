const Baileys = require("baileys");
const util = require("node:util");
const { globSync } = require("glob");
const Ctx = require("./ctx");
const helper = require("./helper");

async function Commands(self, runMiddlewares) {
    const {
        m,
        prefix,
        cmd,
        core
    } = self;
    if (!m.body || Baileys.isJidStatusBroadcast(m.key.remoteJid) || Baileys.isJidNewsletter(m.key.remoteJid)) return;

    const hears = Array.from(self.hearsMap.values() || []).filter(hear => hear.name === m.body || hear.name === m.messageType || new RegExp(hear.name).test(m.body) || (Array.isArray(hear.name) && hear.name.includes(m.body)));
    if (hears.length) {
        const ctx = new Ctx({
            used: {
                hears: m.body
            },
            args: [],
            text: "",
            self,
            client: core
        });
        hears.forEach(hear => hear.code(ctx));
        return;
    }

    const parsed = helper.parseCommand(prefix, m.body);
    if (!parsed.commandName) return;

    const commandsList = Array.from(cmd.values() || []);
    const matched = commandsList.filter(cmd => cmd.name.toLowerCase() === parsed.commandName || (Array.isArray(cmd.aliases) && cmd.aliases.includes(parsed.commandName)) || cmd.aliases === parsed.commandName);
    if (!matched.length) return;

    const ctx = new Ctx({
        used: {
            prefix: parsed.selectedPrefix,
            command: parsed.commandName
        },
        args: parsed.args,
        text: parsed.text,
        self,
        client: core
    });
    if (!await runMiddlewares(ctx)) return;
    matched.forEach(cmd => cmd.code(ctx));
}

class CommandHandler {
    constructor(bot, path) {
        this._bot = bot;
        this._path = path;
    }

    load(isShowLog = true) {
        if (isShowLog) console.group(util.styleText("cyan", "[i]"), "Command Handler");
        const files = globSync("**/*.js", {
            cwd: this._path,
            nodir: true,
            absolute: true
        });
        for (const file of files) {
            try {
                const module = require(file);
                const commands = this._normalizeCommands(module);
                for (const cmd of commands) {
                    this._registerCommand(cmd);
                    if (isShowLog) {
                        const type = cmd.type === "hears" ? "Hears" : "Command";
                        console.log(util.styleText("green", "[+]"), `Loaded ${type} - ${cmd.name}`);
                    }
                }
            } catch (error) {
                if (isShowLog) console.warn(util.styleText("yellow", "[!]"), `Failed to load ${file}: ${error.message}`);
            }
        }
        if (isShowLog) console.groupEnd();
    }

    _normalizeCommands(module) {
        if (module.name && (!module.type || module.type === "command" || module.type === "hears")) return [module];
        if (Array.isArray(module)) return module.filter(cmd => cmd.name && (!cmd.type || cmd.type === "command" || cmd.type === "hears"));
        return [];
    }

    _registerCommand(cmd) {
        if (cmd.type === "hears") {
            this._bot.hearsMap.set(cmd.name, cmd);
        } else {
            this._bot.cmd.set(cmd.name, cmd);
        }
    }
}

module.exports = {
    Commands,
    CommandHandler
};
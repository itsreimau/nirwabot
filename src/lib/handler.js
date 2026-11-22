const Baileys = require("baileys");
const { defineCommand } = require("./_factory");
const Ctx = require("./ctx");
const helper = require("./helper");
const logger = require("../utils/logger");
const util = require("node:util");
const { globSync } = require("glob");

async function Commands(self, runMiddlewares) {
    const {
        m,
        prefix,
        cmd,
        core
    } = self;
    if (!m.body || Baileys.isJidStatusBroadcast(m.key.remoteJid) || Baileys.isJidNewsletter(m.key.remoteJid)) return;

    const hears = Array.from(self.hearsMap.values() || []).filter(hear => hear.name === m.body || hear.name === m.messageType || (hear.name instanceof RegExp && hear.name.test(m.body)) || (Array.isArray(hear.name) && hear.name.includes(m.body)));
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
        for (const hear of hears) {
            try {
                await hear.code(ctx);
            } catch (error) {
                await helper.reportError(ctx, error, Boolean(hear.useAxios), Boolean(hear.silentError));
            }
        }
        return;
    }

    const parsed = helper.parseCommand(prefix, m.body);
    if (!parsed.commandName) return;

    const commandsList = Array.from(cmd.values() || []);
    const matched = commandsList.filter(c => c.name.toLowerCase() === parsed.commandName || (Array.isArray(c.aliases) && c.aliases.includes(parsed.commandName)) || c.aliases === parsed.commandName);
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

    try {
        if (!await runMiddlewares(ctx)) return;
        for (const command of matched) await command.code(ctx);
    } catch (error) {
        const currentCmd = matched[0];
        await helper.reportError(ctx, error, Boolean(currentCmd?.useAxios), Boolean(currentCmd?.silentError));
    } finally {
        await self.core.sendPresenceUpdate("paused", ctx.id).catch(() => {});
    }
}

class CommandHandler {
    constructor(bot, path) {
        this._bot = bot;
        this._path = path;
    }

    load(isShowLog = true) {
        if (isShowLog) logger.group("Command Handler");
        const files = globSync("**/*.js", {
            cwd: this._path,
            nodir: true,
            absolute: true
        }).sort((a, b) => a.localeCompare(b));
        for (const file of files) {
            try {
                const mod = require(file);
                const commands = this._normalizeCommands(mod);
                for (const cmd of commands) {
                    this._registerCommand(cmd);
                    if (isShowLog) logger.success(`Loaded ${cmd.type === "hears" ? "Hears" : "Command"} - ${cmd.name}`);
                }
            } catch (error) {
                if (isShowLog) logger.warn(`Failed to load ${file}: ${util.format(error)}`);
            }
        }
        if (isShowLog) logger.groupEnd();
    }

    _normalizeCommands(mod) {
        if (mod.name && (!mod.type || mod.type === "command" || mod.type === "hears")) return [mod.type === "hears" ? mod : defineCommand(mod)];
        if (Array.isArray(mod)) return mod.filter(cmd => cmd.name && (!cmd.type || cmd.type === "command" || cmd.type === "hears")).map(cmd => cmd.type === "hears" ? cmd : defineCommand(cmd));
        return [];
    }

    _registerCommand(cmd) {
        this._bot[cmd.type === "hears" ? "hearsMap" : "cmd"].set(cmd.name, cmd);
    }
}

module.exports = {
    Commands,
    CommandHandler
};
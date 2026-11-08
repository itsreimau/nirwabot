function defineCommand(command) {
    if (!command || typeof command !== "object" || typeof command.name !== "string" || typeof command.code !== "function") throw new TypeError("A command requires a string name and a code function");
    return {
        type: "command",
        ...command
    };
}

function defineCommands(commands) {
    if (!Array.isArray(commands)) throw new TypeError("defineCommands expects an array");
    return commands.map(defineCommand);
}

module.exports = {
    defineCommand,
    defineCommands
};
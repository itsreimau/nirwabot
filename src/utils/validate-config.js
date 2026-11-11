const REQUIRED = {
    bot: ["name"],
    owner: ["name", "id"],
    system: ["timeZone"]
};

function validateConfig(config) {
    const errors = [];
    for (const [section, keys] of Object.entries(REQUIRED)) {
        if (!config[section] || typeof config[section] !== "object") {
            errors.push(`Missing or invalid "${section}" section`);
            continue;
        }
        for (const key of keys) {
            const value = config[section][key];
            if (value === undefined || value === null || value === "") errors.push(`Missing "${section}.${key}"`);
        }
    }
    if (config.owner && !Array.isArray(config.owner.id)) errors.push('"owner.id" must be an array');
    if (config.owner?.co && !Array.isArray(config.owner.co)) errors.push('"owner.co" must be an array');
    if (errors.length) throw new Error(`Invalid config.json:\n- ${errors.join("\n- ")}`);
    config.owner.co ||= [];
    config.owner.id ||= [];
    config.system ||= {};
    config.bot ||= {};
    config.msg ||= {};
    config.sticker ||= {};
    return config;
}

module.exports = { validateConfig };

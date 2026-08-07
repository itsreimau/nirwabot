const fs = require("node:fs");
const SimplDB = require("simpl.db");

class Config {
    constructor(configPath) {
        this.configPath = configPath;
        this.db = new SimplDB({
            dataFile: configPath,
            tabSize: 2
        });
        this._loadConfig();
    }

    get core() {
        return this.db;
    }

    _loadConfig() {
        if (!fs.existsSync(this.configPath)) return;
        const config = this.db.toJSON();
        this._resolveTemplateStrings(config);
        Object.assign(this, config);
    }

    _resolveTemplateStrings(obj, root = obj) {
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            const value = obj[key];
            if (typeof value === "string") {
                obj[key] = this._resolveTemplate(value, root);
            } else if (typeof value === "object" && value !== null) {
                this._resolveTemplateStrings(value, root);
            }
        }
    }

    _resolveTemplate(str, root) {
        let result = str;
        let changed;
        do {
            changed = false;
            result = result.replace(/%([^%]+)%/g, (match, path) => {
                const value = this._getNestedValue(root, path);
                if (value !== null) {
                    changed = true;
                    return String(value);
                }
                return match;
            });
        } while (changed);
        return result;
    }

    _getNestedValue(obj, path) {
        const keys = path.split("_");
        let current = obj;
        for (const key of keys) {
            if (current && typeof current === "object" && key in current) {
                current = current[key];
            } else {
                return null;
            }
        }
        return current;
    }
}

module.exports = Config;
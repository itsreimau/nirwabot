# Migration notes

## What changed

- Moved application modules from the repository root into `src/` while retaining the command/event/middleware/lib subfolder layout.
- Replaced `global.config` with the validated singleton exported by `src/runtime/config.js` and explicit `require()` imports at call sites.
- Removed the `global.bot` assignment; the client is wired through the existing event, middleware, handler, and context dependencies.
- Added `_factory.js` with `defineCommand()` and `defineCommands()` while preserving legacy command object exports and their public names/aliases/metadata.
- Extracted the client media pipeline and context actions into focused mixins; extracted quiz-game mechanics from the command registry.
- Added shared retry-configured HTTP and lightweight logger utilities.
- Replaced the Unix-only `cp` setup command with a Node.js setup script that works on Windows, macOS, and Linux and never overwrites an existing `config.json`.
- Updated Docker startup, `.gitignore`, `.env.example`, and package scripts/Node engine declaration.

## Preserved

- CommonJS module format.
- Existing command names, aliases, categories, command metadata, event names, and middleware permission keys.
- `simpl.db` as the configuration/database implementation.
- Root `state/` and `database/` paths; no auth credentials or persisted records are copied, reset, or migrated.

## Setup

```sh
npm run setup
# Edit config.json, then:
npm start
```

`npm run setup` creates `config.json` only if it does not exist, then runs `npm install`. In Docker, the setup script is called with `--skip-install` because dependencies are installed in the image build stage.

## Validation notes

All JavaScript files pass `node --check`. A full connection/runtime test was not run in this environment because dependencies (including the GitHub-hosted Baileys package) are not installed and a WhatsApp authentication session is not available. The first real startup should be performed in a clean environment after `npm run setup`.

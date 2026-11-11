# Nirwabot Architecture

Nirwabot is a CommonJS Node.js application. Runtime code lives under `src/`; the root entrypoint only loads environment variables, validates configuration through the runtime config module, starts the optional health HTTP endpoint, and boots the bot.

## Layout

- `src/main.js` — application composition and dependency wiring.
- `src/runtime/config.js` — one validated `Config` instance backed by `simpl.db`.
- `src/lib/` — WhatsApp client, message context, command handler, database helpers, and domain primitives.
- `src/lib/_factory.js` — `defineCommand()` / `defineCommands()` command definition helpers.
- `src/lib/client-media.js` — outgoing sticker/contact/sticker-pack processing mixin.
- `src/lib/ctx-actions.js` — message and interaction actions mixed into `Ctx`.
- `src/commands/` — feature commands, retaining their existing command names, aliases, categories, and permission metadata.
- `src/events/` — connection and message event handlers.
- `src/middlewares/` — command and message middleware.
- `src/utils/` — shared logger, HTTP client, and config validation.
- `scripts/setup.js` — cross-platform config bootstrap and dependency installation.

## Runtime flow

1. `index.js` loads `.env` (when present) and imports `src/runtime/config.js`.
2. `Config` reads `config.json` through `simpl.db`; validation fails fast for missing required sections/fields.
3. `src/main.js` constructs `Client`, registers events and middleware, loads commands from `src/commands`, then launches the Baileys connection.
4. `CommandHandler` normalizes legacy command objects through the factory helpers and registers commands/hears in the client maps.
5. `Ctx` provides a per-message API over the client, database, helpers, and shared HTTP client.

## Configuration and persistence

- `config.json` remains the source of bot configuration and is generated from `config.example.json` by `npm run setup`.
- `simpl.db` remains the persistence layer. Database files stay in the root `database/` directory.
- WhatsApp authentication remains in root `state/`; neither auth files nor persisted user/group data are migrated or rewritten by this refactor.
- Optional environment variables: `PORT` overrides `system.port` for the health endpoint; `NODE_ENV` is available to the runtime.

## Command authoring

A command remains a CommonJS object with `name`, optional `aliases`, `category`, permission metadata, and `code(ctx)`. New modules may use `defineCommand()` or `defineCommands()` from `src/lib/_factory.js`; legacy object exports remain supported.

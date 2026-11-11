# Refactor diff summary

- Relocated 130+ runtime source files into `src/` and updated runtime entrypoints and command discovery paths.
- Added explicit config imports across modules and removed all `global.config` / `global.bot` writes.
- Added validated config singleton, command factory helpers, shared HTTP retry client, logger utility, setup/check scripts, architecture docs, migration notes, and environment template.
- Split client media processing, context actions, and quiz-game implementation into separate modules to reduce oversized source files.
- Updated package scripts, Node engine requirement, dotenv support, Dockerfile, and ignore rules.
- Kept `simpl.db`, CommonJS, existing feature modules, command exports, aliases, permission metadata, root auth path (`state/`), and database path (`database/`).

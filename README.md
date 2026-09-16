# <img src="https://matterbridge.io/assets/matterbridge.svg" alt="Matterbridge Logo" width="64px" height="64px">&nbsp;&nbsp;&nbsp;Matterbridge test plugin

[![npm version](https://img.shields.io/npm/v/matterbridge-test.svg)](https://www.npmjs.com/package/matterbridge-test)
[![npm downloads](https://img.shields.io/npm/dt/matterbridge-test.svg)](https://www.npmjs.com/package/matterbridge-test)
[![Docker Version](https://img.shields.io/docker/v/luligu/matterbridge/latest?label=docker%20version)](https://hub.docker.com/r/luligu/matterbridge)
[![Docker Pulls](https://img.shields.io/docker/pulls/luligu/matterbridge?label=docker%20pulls)](https://hub.docker.com/r/luligu/matterbridge)
![Node.js CI](https://github.com/Luligu/matterbridge-test/actions/workflows/build.yml/badge.svg)
![CodeQL](https://github.com/Luligu/matterbridge-test/actions/workflows/codeql.yml/badge.svg)
[![codecov](https://codecov.io/gh/Luligu/matterbridge-test/branch/main/graph/badge.svg)](https://codecov.io/gh/Luligu/matterbridge-test)
[![tested with Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9F18.svg?logo=vitest&logoColor=white)](https://vitest.dev)
[![styled with Oxc](https://img.shields.io/badge/styled_with-Oxc-9BE4E0.svg?logo=oxc&logoColor=white)](https://oxc.rs/docs/guide/usage/formatter.html)
[![linted with Oxc](https://img.shields.io/badge/linted_with-Oxc-9BE4E0.svg?logo=oxc&logoColor=white)](https://oxc.rs/docs/guide/usage/linter.html)
[![TypeScript Native](https://img.shields.io/badge/TypeScript_Native-3178C6?logo=typescript&logoColor=white)](https://github.com/microsoft/typescript-go)
[![ESM](https://img.shields.io/badge/ESM-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![matterbridge.io](https://img.shields.io/badge/matterbridge.io-online-brightgreen)](https://matterbridge.io)

[![powered by](https://img.shields.io/badge/powered%20by-matterbridge-blue)](https://www.npmjs.com/package/matterbridge)
[![powered by](https://img.shields.io/badge/powered%20by-matter--history-blue)](https://www.npmjs.com/package/matter-history)
[![powered by](https://img.shields.io/badge/powered%20by-node--ansi--logger-blue)](https://www.npmjs.com/package/node-ansi-logger)
[![powered by](https://img.shields.io/badge/powered%20by-node--persist--manager-blue)](https://www.npmjs.com/package/node-persist-manager)

---

This is the test plugin we use for Matterbridge tests.

It is designed to throw exceptions at various points to test Matterbridge's responses.

Additionally, it can generate an unlimited number of devices to test the controller's capabilities, and the update interval is configurable.

Interval updates set current and power to zero for switches, outlets, and lights toggled off, and generate simulated measurements for those toggled on. Cumulative imported energy increases only when the device is toggled on.

With electrical measurements enabled, on/off changes also update generated switches, outlets, and lights immediately: off sets current and power to zero, and on restores their initial values of `2_500` and `550_000`, respectively.

The standalone `LightServerFlat`, `OutletServerFlat`, and `OutletServerComposed` devices set their `activeCurrent` and `activePower` measurements to zero when switched off and restore their initial values of `1_000` and `220_000`, respectively, when switched on. For `OutletServerComposed`, the on/off child controls the measurements on the electrical sensor child.

If you want to write your plugin, the easiest way to start create a new plugin is to clone the [Matterbridge Plugin Template](https://github.com/Luligu/matterbridge-plugin-template) which has **Dev Container support for instant development environment** and all tools and extensions (like Node.js, npm, TypeScript, ESLint, Prettier, Jest and Vitest) already loaded and configured.

If you like this project and find it useful, please consider giving it a star on [GitHub](https://github.com/Luligu/matterbridge-test) and sponsoring it.

<a href="https://www.buymeacoffee.com/luligugithub">
  <img src="https://matterbridge.io/assets/bmc-button.svg" alt="Buy me a coffee" width="120">
</a>

## Prerequisites

### Matterbridge

See the guidelines on [Matterbridge](https://matterbridge.io) for more information.

## Style guide

See also the [Style Guide](./STYLEGUIDE.md) for JSDoc, naming, and logging conventions used in this repository.

## Repository toolchain

> **Note:** This repository uses a new toolchain. It replaces the traditional TypeScript / ESLint / Prettier / Jest stack with a faster and lighter setup.

- **No `typescript 6.x` package** — replaced by [TypeScript Native 7.x](https://github.com/microsoft/typescript-go).
- **No ESLint, no Prettier** — replaced by the [oxc](https://oxc.rs) stack: [oxlint](https://oxc.rs/docs/guide/usage/linter.html) for linting and [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for formatting.
- **No Jest** — replaced by [Vitest](https://vitest.dev), which is much faster and natively supports ESM without extra configuration.
- **Far fewer development dependencies** — the number of installed packages drops from **~600** to **~75**. A clean install is much faster.
- **Much faster linting and formatting** — oxlint and oxfmt run in a fraction of the time required by the ESLint / Prettier pipeline.
- **Much faster builds** — tsgo compiles the project in a fraction of the time required by the standard `tsc` build.
- **Editor support** — use the VS Code extensions for tsgo and oxc to get the same experience in the editor.

## Agent instructions

Guidance is written once in `.agents/` and reached by every agent. Content lives only in the source files; the stubs exist because each tool discovers rules from its own hardcoded folder.

| File                                     | Notes                                                            |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `AGENTS.md`                              | Shared project instructions — the single source                  |
| `CLAUDE.md`                              | Imports `AGENTS.md`, plus Claude-specific notes                  |
| `.github/copilot-instructions.md`        | Points Copilot at `AGENTS.md`                                    |
| `.agents/README.md`                      | How the shared setup is wired                                    |
| `.agents/rules/*.instructions.md`        | Path-scoped guidance — the content                               |
| `.agents/skills/<name>/SKILL.md`         | Agent Skills — discovered natively, no stub needed               |
| `.github/instructions/*.instructions.md` | Stubs with `applyTo` globs, for Copilot in VS Code and on GitHub |
| `.claude/rules/*.md`                     | Stubs with `paths` globs, for Claude Code                        |
| `.claude/skills/<name>/SKILL.md`         | Stubs importing the shared skills, for Claude Code               |
| `.codex/config.toml`                     | Codex project permissions, approvals, and profile                |
| `.codex/rules/default.rules`             | Codex command allow, prompt, and deny rules                      |

Rules currently defined: `chip-tests` (CHIP conformance test harness), `matterbridge` (endpoint guide), `plugin-frontend` (plugin SPA and REST API), `testing` (unit test standards).

| Tool                 | Instructions                    | Rules                            | Skills                     |
| -------------------- | ------------------------------- | -------------------------------- | -------------------------- |
| Codex                | `AGENTS.md`                     | links in `AGENTS.md`             | `.agents/skills` (native)  |
| Copilot (VS Code)    | `AGENTS.md`                     | stubs in `.github/instructions/` | `.agents/skills` (native)  |
| Copilot coding agent | `AGENTS.md`                     | stubs in `.github/instructions/` | `.agents/skills` (native)  |
| Claude Code          | `CLAUDE.md` imports `AGENTS.md` | stubs in `.claude/rules/`        | stubs in `.claude/skills/` |

## Development guide

Refer to the Matterbridge [Development guide](https://matterbridge.io/README-DEV.html) for other guidelines.

---

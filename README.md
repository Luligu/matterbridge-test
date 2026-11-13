# <img src="https://matterbridge.io/assets/matterbridge.svg" alt="Matterbridge Logo" width="64px" height="64px">&nbsp;&nbsp;&nbsp;Matterbridge test plugin

[![npm version](https://img.shields.io/npm/v/matterbridge-test.svg)](https://www.npmjs.com/package/matterbridge-test)
[![npm downloads](https://img.shields.io/npm/dt/matterbridge-test.svg)](https://www.npmjs.com/package/matterbridge-test)
[![Docker Version](https://img.shields.io/docker/v/luligu/matterbridge/latest?label=docker%20version)](https://hub.docker.com/r/luligu/matterbridge)
[![Docker Pulls](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/Luligu/b21088ab9c9f2b119b42c33f0fef218d/raw/docker.json)](https://hub.docker.com/r/luligu/matterbridge)
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

The standalone `PowerStripServer` has a PowerSource parent at endpoint `1000` and four children, `onOff1`–`onOff4`, at endpoints `1001`–`1004`. Each child combines an on/off plug-in unit and an electrical sensor. Switching an outlet off sets only its own current and power to zero; switching it on restores `1_000` and `220_000`, respectively.

Set `enableServerDevices` to `true` to create the four standalone server devices. It defaults to `false`.

During configuration, all four standalone servers also reset current and power to zero for outlets or lights whose restored on/off state is off, including each power-strip outlet independently.

If you want to write your plugin, the easiest way to start create a new plugin is to clone the [Matterbridge Plugin Template](https://github.com/Luligu/matterbridge-plugin-template) which has **Dev Container support for instant development environment** and all tools and extensions (like Node.js, npm, Bun, TypeScript Native, Oxc and Vitest) already loaded and configured.

If you like this project and find it useful, please consider giving it a star on [GitHub](https://github.com/Luligu/matterbridge-test) and sponsoring it.

<a href="https://www.buymeacoffee.com/luligugithub">
  <img src="https://matterbridge.io/assets/bmc-button.svg" alt="Buy me a coffee" width="120">
</a>

## Prerequisites

### Matterbridge

See the guidelines on [Matterbridge](https://matterbridge.io) for more information.

## Development guide

Refer to the Matterbridge [Development guide](https://matterbridge.io/README-DEV.html) for other guidelines.

## Repository toolchain

See [TOOLCHAIN.md](./TOOLCHAIN.md) for compilers, linting, formatting, testing, and editor support.

## Shared agent instructions

See [SHARED-AGENTS.md](./SHARED-AGENTS.md) for shared guidance, rules, skills, and configuration for coding agents.

See [.agents/README.md](./.agents/README.md) for the shared instructions layout and versioning.

## Shared dev container support

See [.devcontainer/README.md](./.devcontainer/README.md) for the shared development container setup and usage.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## Style guide

See [STYLEGUIDE.md](./STYLEGUIDE.md) for code style, naming, documentation, and testing conventions.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history and notable changes.

## Issues and feature requests

Report bugs and suggest improvements on [GitHub Issues](https://github.com/Luligu/matterbridge-test/issues).

## License

Licensed under the [Apache License 2.0](./LICENSE).

## Support the project

If you find this project useful, please consider giving it a star on [GitHub](https://github.com/Luligu/matterbridge-test) and sponsoring it. Your support helps maintain and improve the project.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/luligugithub)

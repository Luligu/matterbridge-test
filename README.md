# <img src="matterbridge.svg" alt="Matterbridge Logo" width="64px" height="64px">&nbsp;&nbsp;&nbsp;Matterbridge test plugin

[![npm version](https://img.shields.io/npm/v/matterbridge-test.svg)](https://www.npmjs.com/package/matterbridge-test)
[![npm downloads](https://img.shields.io/npm/dt/matterbridge-test.svg)](https://www.npmjs.com/package/matterbridge-test)
[![Docker Version](https://img.shields.io/docker/v/luligu/matterbridge?label=docker%20version&sort=semver)](https://hub.docker.com/r/luligu/matterbridge)
[![Docker Pulls](https://img.shields.io/docker/pulls/luligu/matterbridge.svg)](https://hub.docker.com/r/luligu/matterbridge)
![Node.js CI](https://github.com/Luligu/matterbridge-test/actions/workflows/build-matterbridge-plugin.yml/badge.svg)
![Jest coverage](https://img.shields.io/badge/Jest%20coverage-100%25-brightgreen)

[![power by](https://img.shields.io/badge/powered%20by-matterbridge-blue)](https://www.npmjs.com/package/matterbridge)
[![power by](https://img.shields.io/badge/powered%20by-matter--history-blue)](https://www.npmjs.com/package/matter-history)
[![power by](https://img.shields.io/badge/powered%20by-node--ansi--logger-blue)](https://www.npmjs.com/package/node-ansi-logger)
[![power by](https://img.shields.io/badge/powered%20by-node--persist--manager-blue)](https://www.npmjs.com/package/node-persist-manager)

---

This is the test plugin we use for Matterbridge.

It is designed to throw exceptions at various points to test Matterbridge's responses.

Additionally, it can generate an unlimited number of devices to test the controller's capabilities, and the update interval is configurable.

For internal use only!

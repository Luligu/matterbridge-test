/**
 * This file contains the entry point of the plugin TestPlatform.
 *
 * @file index.ts
 * @author Luca Liguori
 * @version 1.0.0
 * @license Apache-2.0
 *
 * Copyright 2023, 2024, 2025, 2026 Luca Liguori.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PlatformConfig, PlatformMatterbridge } from 'matterbridge';
import { AnsiLogger } from 'matterbridge/logger';

import { TestPlatform, TestPlatformConfig } from './platform.js';

/**
 * This is the standard interface for Matterbridge plugins.
 * Each plugin should export a default function that follows this signature.
 *
 * @param {Matterbridge} matterbridge - An instance of MatterBridge. This is the main interface for interacting with the MatterBridge system.
 * @param {AnsiLogger} log - An instance of AnsiLogger. This is used for logging messages in a format that can be displayed with ANSI color codes.
 * @param {PlatformConfig} config - The platform configuration.
 * @returns {TestPlatform} - An instance of the SomfyTahomaPlatform. This is the main interface for interacting with the Somfy Tahoma system.
 */
export default function initializePlugin(matterbridge: PlatformMatterbridge, log: AnsiLogger, config: PlatformConfig): TestPlatform {
  return new TestPlatform(matterbridge, log, config as TestPlatformConfig);
}

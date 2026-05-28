const NAME = 'JestMatter';
const MATTER_PORT = 7000;

import { jest } from '@jest/globals';
import {
  aggregator,
  createServerNode,
  createTestEnvironment,
  destroyTestEnvironment,
  getPlatformMatterbridge,
  log,
  loggerLogSpy,
  server,
  setDebug,
  setupTest,
  startServerNode,
  stopServerNode,
} from '@matterbridge/jest-utils';
import { MatterbridgeEndpoint, PlatformConfig } from 'matterbridge';
import { LogLevel } from 'matterbridge/logger';
import { ColorControl, Identify, LevelControl, ModeSelect, OnOff } from 'matterbridge/matter/clusters';

import initializePlugin, { TestPlatform, TestPlatformConfig } from '../src/module.js';

// Setup the test environment
await setupTest(NAME, false);

describe('TestPlatform', () => {
  let testPlatform: TestPlatform;

  const config: TestPlatformConfig = {
    name: 'matterbridge-test',
    type: 'DynamicPlatform',
    version: '1.0.0',
    delayStart: false,
    longDelayStart: false,
    noDevices: false,
    throwLoad: false,
    throwStart: false,
    throwConfigure: false,
    throwShutdown: false,
    loadSwitches: 1,
    loadOutlets: 1,
    loadLights: 1,
    whiteList: [],
    blackList: [],
    setUpdateInterval: 30,
    enableElectrical: true,
    enablePowerSource: true,
    enableModeSelect: true,
    enableReachable: true,
    debug: true,
    unregisterOnShutdown: true,
  };

  beforeAll(async () => {
    // Create Matterbridge environment
    await createTestEnvironment();
    await createServerNode(MATTER_PORT);
    await startServerNode();
  });

  beforeEach(() => {
    // Reset the mock calls before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup after each test
    // Clear debug
    await setDebug(false);
  });

  afterAll(async () => {
    // Destroy Matterbridge environment
    await stopServerNode();
    await destroyTestEnvironment();
    // Restore all mocks
    jest.restoreAllMocks();
  });

  it('should initialize the platform successfully', async () => {
    const matterbridge = await getPlatformMatterbridge();
    expect(matterbridge).toBeDefined();
  });
});

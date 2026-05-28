const NAME = 'VitestMatter';
const MATTER_PORT = 8000;

import { LogLevel } from 'matterbridge/logger';
import {
  createServerNode,
  createTestEnvironment,
  destroyTestEnvironment,
  getPlatformMatterbridge,
  log,
  loggerLogSpy,
  setDebug,
  setupTest,
  startServerNode,
  stopServerNode,
} from 'matterbridge/vitest-utils';

import { TestPlatform, type TestPlatformConfig } from '../src/module.js';

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
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clear debug
    await setDebug(false);
  });

  afterAll(async () => {
    // Destroy Matterbridge environment
    await stopServerNode();
    await destroyTestEnvironment();
    // Restore all mocks
    vi.restoreAllMocks();
  });

  it('should initialize platform with config name', async () => {
    const matterbridge = await getPlatformMatterbridge();
    testPlatform = new TestPlatform(matterbridge, log, config);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Initializing platform:', config.name);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Finished initializing platform:', config.name);
    await testPlatform.onStart('Starting test');
    await testPlatform.onConfigure();
    await testPlatform.onShutdown('Closing test');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Closing test');
  });
});

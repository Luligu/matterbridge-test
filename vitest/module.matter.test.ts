/* eslint-disable vitest/no-conditional-expect */

const NAME = 'VitestMatter';
const MATTER_PORT = 8000;

import { MatterbridgeEndpoint, PlatformMatterbridge } from 'matterbridge';
import { LogLevel } from 'matterbridge/logger';
import { ColorControl, Identify, LevelControl, ModeSelect, OnOff } from 'matterbridge/matter/clusters';
import { flushAsync, log, loggerLogSpy, setDebug, setupTest } from 'matterbridge/vitest-utils';
import { createServerNode, createTestEnvironment, destroyTestEnvironment, getMatterbridge, startServerNode, stopServerNode } from 'matterbridge/vitest-utils/matter';

import initializePlugin, { TestPlatform, type TestPlatformConfig } from '../src/module.js';

// Warning: the tests in this unit are supposed to run sequentially.

// Setup the test environment
await setupTest(NAME, false);

describe('TestPlatform', async () => {
  let matterbridge: PlatformMatterbridge;
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
    matterbridge = await getMatterbridge();
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

  it('should throw error in load when throwLoad is true', () => {
    expect(() => new TestPlatform(matterbridge, log, { ...config, throwLoad: true })).toThrow('Throwing error in load');
  });

  it('should throw error in start when throwStart is true', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, throwStart: true });
    await expect(testPlatform.onStart()).rejects.toThrow('Throwing error in start');
  });

  it('should throw error in configure when throwConfigure is true', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, throwConfigure: true });
    await expect(testPlatform.onConfigure()).rejects.toThrow('Throwing error in configure');
  });

  it('should throw error in shutdown when throwShutdown is true', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, throwShutdown: true });
    await expect(testPlatform.onShutdown()).rejects.toThrow('Throwing error in shutdown');
  });

  it('should throw error in load when version is not valid', () => {
    expect(() => new TestPlatform({ ...matterbridge, matterbridgeVersion: '1.5.0' }, log, config)).toThrow(
      'The test plugin requires Matterbridge version >= "3.8.0". Please update Matterbridge to the latest version in the frontend.',
    );
  });

  it('should run the platform', async () => {
    testPlatform = initializePlugin(matterbridge, log, { ...config, unregisterOnShutdown: true });
    expect(testPlatform).toBeInstanceOf(TestPlatform);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Initializing platform:', config.name);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Finished initializing platform:', config.name);

    await testPlatform.onStart('Starting test');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onStart called with reason:', 'Starting test');

    // Invoke command handlers
    for (const device of testPlatform.getDevices()) {
      if (device.hasClusterServer(Identify)) {
        await device.commandHandler.executeHandler('identify', { request: { identifyTime: 1 } } as any);
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received identify command'));
      }

      if (device.hasClusterServer(OnOff)) {
        await device.commandHandler.executeHandler('on', {} as any);
        await device.commandHandler.executeHandler('off', {} as any);
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received on command'));
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received off command'));
      }

      if ((device.parts.get(device.id + '_modeSelect') as MatterbridgeEndpoint | undefined)?.hasClusterServer(ModeSelect)) {
        await (device.parts.get(device.id + '_modeSelect') as MatterbridgeEndpoint | undefined)?.commandHandler.executeHandler('changeToMode', { request: { newMode: 1 } } as any);
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received changeToMode command'));
      }

      if (device.hasClusterServer(LevelControl)) {
        await device.commandHandler.executeHandler('moveToLevel', { request: { level: 1 } } as any);
        await device.commandHandler.executeHandler('moveToLevelWithOnOff', { request: { level: 1 } } as any);
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received moveToLevel command'));
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received moveToLevelWithOnOff command'));
      }

      if (device.hasClusterServer(ColorControl)) {
        await device.commandHandler.executeHandler('moveToColor', { request: { colorX: 100, colorY: 100 } } as any);
        await device.commandHandler.executeHandler('moveToHueAndSaturation', { request: { hue: 100, saturation: 100 } } as any);
        await device.commandHandler.executeHandler('moveToHue', { request: { hue: 100 } } as any);
        await device.commandHandler.executeHandler('moveToSaturation', { request: { saturation: 100 } } as any);
        await device.commandHandler.executeHandler('moveToColorTemperature', { request: { colorTemperatureMireds: 470 } } as any);
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received moveToColor command'));
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received moveToHueAndSaturation command'));
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received moveToHue command'));
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received moveToSaturation command'));
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received moveToColorTemperature command'));
      }
    }

    await testPlatform.onChangeLoggerLevel(LogLevel.DEBUG);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Logger level set to: debug'));

    await testPlatform.onConfigChanged(config);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('has been updated'));

    await testPlatform.onAction('Test action');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received action'));
    await testPlatform.onAction('turnOn');
    await testPlatform.onAction('turnOff');
    await testPlatform.onAction('turnOnDevice', 'Switch 0');
    await testPlatform.onAction('turnOffDevice', 'Switch 0');
    await testPlatform.onAction('turnOnDevice', 'Switch');
    await testPlatform.onAction('turnOffDevice', 'Switch');

    // Fetch tests
    const valid = await testPlatform.onFetch('GET', 'valid');
    expect(valid).toEqual({ status: 'ok', plugin: testPlatform.name });
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.DEBUG, expect.stringContaining('received onFetch'));

    const post = await testPlatform.onFetch('POST', 'resource', {}, { action: 'create' });
    expect(post).toEqual({ status: 'created', plugin: testPlatform.name });

    const put = await testPlatform.onFetch('PUT', 'resource', {}, { action: 'replace' });
    expect(put).toEqual({ status: 'updated', plugin: testPlatform.name });

    const patch = await testPlatform.onFetch('PATCH', 'resource', {}, { action: 'update' });
    expect(patch).toEqual({ status: 'patched', plugin: testPlatform.name });

    const del = await testPlatform.onFetch('DELETE', 'resource');
    expect(del).toEqual({});

    const unknownPath = await testPlatform.onFetch('GET', 'invalid');
    expect(unknownPath).toBeUndefined();

    const unknownMethod = await testPlatform.onFetch('POST', 'valid', {}, { data: 'test' });
    expect(unknownMethod).toBeUndefined();

    // Configure and interval tests
    testPlatform.config.setUpdateInterval = 0.2; // Set a short interval of 200ms for testing
    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');
    await flushAsync();
    // @ts-expect-error Accessing private property for testing
    clearInterval(testPlatform.interval);

    // Simulate multiple interval executions
    for (let i = 0; i < 10; i++) {
      await testPlatform.intervalHandler();
    }

    await testPlatform.onShutdown('Closing test');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Closing test');
  }, 60000);
});

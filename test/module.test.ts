/* eslint-disable jest/no-conditional-expect */

const NAME = 'TestPlatform';
const MATTER_PORT = 6000;
const CREATE_ONLY = true;

import { jest } from '@jest/globals';
import type { MatterbridgeEndpoint } from 'matterbridge';
import {
  addBridgedEndpointMatterbridgeSpy,
  addMatterbridgePlatform,
  createMatterbridgeEnvironment,
  destroyMatterbridgeEnvironment,
  flushAsync,
  log,
  loggerErrorSpy,
  loggerFatalSpy,
  loggerLogSpy,
  loggerWarnSpy,
  matterbridge,
  removeAllBridgedEndpointsMatterbridgeSpy,
  setDebug,
  setupTest,
  startMatterbridgeEnvironment,
  stopMatterbridgeEnvironment,
} from 'matterbridge/jestutils';
import { LogLevel } from 'matterbridge/logger';
import { ColorControl, Identify, LevelControl, ModeSelect, OnOff } from 'matterbridge/matter/clusters';

import initializePlugin, { TestPlatform, type TestPlatformConfig } from '../src/module.js';

// Warning: the tests in this unit are supposed to run sequentially.

// Setup the test environment
process.argv = ['node', NAME, '--logger', 'debug', '--filelogger', '--matterlogger', 'debug', '--matterfilelogger'];
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
    await createMatterbridgeEnvironment();
    await startMatterbridgeEnvironment(MATTER_PORT, CREATE_ONLY);
  });

  beforeEach(() => {
    // Reset the mock calls before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup after each test
    if (testPlatform) {
      testPlatform.config.throwShutdown = false;
      await testPlatform.unregisterAllDevices();
      await testPlatform.onShutdown();
    }
    // Clear debug
    await setDebug(false);
    // No errors should be logged
    // eslint-disable-next-line jest/no-standalone-expect
    expect(loggerWarnSpy).not.toHaveBeenCalled();
    // eslint-disable-next-line jest/no-standalone-expect
    expect(loggerErrorSpy).not.toHaveBeenCalled();
    // eslint-disable-next-line jest/no-standalone-expect
    expect(loggerFatalSpy).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    // Destroy Matterbridge environment
    await stopMatterbridgeEnvironment(CREATE_ONLY);
    await destroyMatterbridgeEnvironment();
    // Restore all mocks
    jest.restoreAllMocks();
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
    const savedVersion = matterbridge.matterbridgeVersion;
    matterbridge.matterbridgeVersion = '1.5.0';
    expect(() => new TestPlatform(matterbridge, log, config)).toThrow(
      'The test plugin requires Matterbridge version >= "3.8.0". Please update Matterbridge to the latest version in the frontend.',
    );
    matterbridge.matterbridgeVersion = savedVersion;
  });

  it('should return an instance of TestPlatform', async () => {
    testPlatform = initializePlugin(matterbridge, log, { ...config, unregisterOnShutdown: true });
    expect(testPlatform).toBeInstanceOf(TestPlatform);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Initializing platform:', config.name);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Finished initializing platform:', config.name);
    await testPlatform.onShutdown();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'none');
  });

  it('should initialize platform with config name', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true });
    addMatterbridgePlatform(testPlatform);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Initializing platform:', config.name);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Finished initializing platform:', config.name);
    await testPlatform.onShutdown('Closing test');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Closing test');
  });

  it('should call onStart and run interval', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true, setUpdateInterval: 2 });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onStart called with reason:', 'none');
    expect(testPlatform.getDevices()).toHaveLength(config.loadSwitches + config.loadOutlets + config.loadLights);
    jest.useFakeTimers();
    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');
    jest.advanceTimersByTime(65 * 1000);
    jest.useRealTimers();
    await flushAsync();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Interval called');
    await testPlatform.onShutdown();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'none');
  }, 30000);

  it('should call onStart with reason and no devices with no update interval', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true, setUpdateInterval: 0, whiteList: ['No devices'] });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onStart called with reason:', 'Test reason');
    expect(testPlatform.getDevices()).toHaveLength(0);
    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');
    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  }, 30000);

  it('should call onStart and invoke commandHandlers', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true, setUpdateInterval: 2 });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onStart called with reason:', 'Test reason');
    // @ts-expect-error Accessing private method for testing
    await testPlatform.clearEndpointNumbers();

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

    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  }, 30000);

  it('should not register in start when noDevices is true', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true, noDevices: true });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart('Test reason');
    expect(addBridgedEndpointMatterbridgeSpy).not.toHaveBeenCalled();
    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  });

  it('should call onConfigure', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    // @ts-expect-error Accessing private method for testing
    await testPlatform.clearEndpointNumbers();

    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');

    // Simulate multiple interval executions
    for (let i = 0; i < 10; i++) {
      await testPlatform.intervalHandler();
    }

    expect(loggerLogSpy).toHaveBeenCalled();
    expect(loggerLogSpy).not.toHaveBeenCalledWith(LogLevel.ERROR, expect.anything());
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Interval called');

    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  });

  it('should call onAction', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart('Test reason');
    // @ts-expect-error Accessing private method for testing
    await testPlatform.clearEndpointNumbers();

    await testPlatform.onAction('Test action');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received action'));
    await testPlatform.onAction('turnOn');
    await testPlatform.onAction('turnOff');
    await testPlatform.onAction('turnOnDevice', 'Switch 0');
    await testPlatform.onAction('turnOffDevice', 'Switch 0');
    await testPlatform.onAction('turnOnDevice', 'Switch');
    await testPlatform.onAction('turnOffDevice', 'Switch');
    jest.clearAllMocks();

    await testPlatform.onShutdown('Test reason');
  });

  it('should call onChangeLoggerLevel', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true });
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    await testPlatform.onChangeLoggerLevel(LogLevel.DEBUG);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Logger level set to: debug'));
    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  });

  it('should call onConfigChanged', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true });
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    await testPlatform.onConfigChanged(config);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('has been updated'));
    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  });

  it('should call onFetch and return value for valid GET and undefined for unknown path or method', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, unregisterOnShutdown: true });
    await testPlatform.onStart('Test reason');

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

    await testPlatform.onShutdown();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'none');
  });
});

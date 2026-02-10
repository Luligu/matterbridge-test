/* eslint-disable jest/no-conditional-expect */

const MATTER_PORT = 6000;
const NAME = 'Platform';
const HOMEDIR = path.join('jest', NAME);

import path from 'node:path';

import { jest } from '@jest/globals';
import { PlatformConfig } from 'matterbridge';
import { LogLevel } from 'matterbridge/logger';
import { OnOffCluster, ModeSelectCluster, IdentifyCluster, LevelControlCluster, ColorControlCluster } from 'matterbridge/matter/clusters';
import {
  addBridgedEndpointSpy,
  addMatterbridgePlatform,
  createMatterbridgeEnvironment,
  destroyMatterbridgeEnvironment,
  log,
  loggerLogSpy,
  matterbridge,
  removeAllBridgedEndpointsSpy,
  setupTest,
  startMatterbridgeEnvironment,
  stopMatterbridgeEnvironment,
} from 'matterbridge/jestutils';

import initializePlugin, { TestPlatform, TestPlatformConfig } from './module.ts';

// Setup the test environment
await setupTest('NAME', false);

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
    await createMatterbridgeEnvironment(NAME);
    await startMatterbridgeEnvironment(MATTER_PORT);
  });

  beforeEach(() => {
    // Reset the mock calls before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup after each test
    if (testPlatform) {
      testPlatform.config.throwShutdown = false;
      await testPlatform.onShutdown();
    }
  });

  afterAll(async () => {
    await stopMatterbridgeEnvironment();
    await destroyMatterbridgeEnvironment();
    // Restore all mocks
    jest.restoreAllMocks();
  });

  it('should return an instance of TestPlatform', async () => {
    const platform = initializePlugin(matterbridge, log, config);
    expect(platform).toBeInstanceOf(TestPlatform);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Initializing platform:', config.name);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Finished initializing platform:', config.name);
    await platform.onShutdown();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'none');
  });

  it('should initialize platform with config name', async () => {
    testPlatform = new TestPlatform(matterbridge, log, config);
    addMatterbridgePlatform(testPlatform);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Initializing platform:', config.name);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Finished initializing platform:', config.name);
    await testPlatform.onShutdown('Closing test');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Closing test');
  });

  it('should throw error in load when throwLoad is true', () => {
    expect(() => new TestPlatform(matterbridge, log, { ...config, throwLoad: true })).toThrow('Throwing error in load');
  });

  it('should throw error in load when version is not valid', () => {
    matterbridge.matterbridgeVersion = '1.5.0';
    expect(() => new TestPlatform(matterbridge, log, config)).toThrow(
      'The test plugin requires Matterbridge version >= "3.4.0". Please update Matterbridge to the latest version in the frontend.',
    );
    matterbridge.matterbridgeVersion = '3.4.0';
  });

  it('should call onStart', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, setUpdateInterval: 2 });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onStart called with reason:', 'none');
    jest.useFakeTimers();
    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');
    jest.advanceTimersByTime(60 * 1000);
    jest.useRealTimers();
    await testPlatform.onShutdown();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'none');
  }, 30000);

  it('should call onStart with reason and no devices with no update interval', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, setUpdateInterval: 0, whiteList: ['No devices'] });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onStart called with reason:', 'Test reason');
    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');
    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  }, 30000);

  it('should call onStart and invoke commandHandlers', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, setUpdateInterval: 2 });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onStart called with reason:', 'Test reason');

    // Invoke command handlers
    for (const [key, device] of Array.from(testPlatform.bridgedDevices)) {
      if (device.hasClusterServer(IdentifyCluster)) {
        await device.commandHandler.executeHandler('identify', { request: { identifyTime: 1 } } as any);
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received identify command'));
      }

      if (device.hasClusterServer(OnOffCluster)) {
        await device.commandHandler.executeHandler('on', {} as any);
        await device.commandHandler.executeHandler('off', {} as any);
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received on command'));
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received off command'));
      }

      if (device.hasClusterServer(ModeSelectCluster)) {
        await device.commandHandler.executeHandler('changeToMode', { request: { newMode: 1 } } as any);
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received changeToMode command'));
      }

      if (device.hasClusterServer(LevelControlCluster)) {
        await device.commandHandler.executeHandler('moveToLevel', { request: { level: 1 } } as any);
        await device.commandHandler.executeHandler('moveToLevelWithOnOff', { request: { level: 1 } } as any);
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received moveToLevel command'));
        expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received moveToLevelWithOnOff command'));
      }

      if (device.hasClusterServer(ColorControlCluster)) {
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
  }, 30000);

  it('should not register in start when noDevices is true', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, noDevices: true });
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart('Test reason');
    expect(addBridgedEndpointSpy).not.toHaveBeenCalled();
    await testPlatform.unregisterAllDevices();
    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
    expect(removeAllBridgedEndpointsSpy).toHaveBeenCalled();
  });

  it('should throw error in start when throwStart is true', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, throwStart: true });
    testPlatform.version = '1.6.6';
    await expect(testPlatform.onStart()).rejects.toThrow('Throwing error in start');
  });

  it('should call onConfigure', async () => {
    testPlatform = new TestPlatform(matterbridge, log, config);
    addMatterbridgePlatform(testPlatform);
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();

    jest.useFakeTimers();

    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');

    // Simulate multiple interval executions
    for (let i = 0; i < 10; i++) {
      await jest.advanceTimersByTimeAsync(61 * 1000);
    }

    jest.useRealTimers();

    expect(loggerLogSpy).toHaveBeenCalled();
    expect(loggerLogSpy).not.toHaveBeenCalledWith(LogLevel.ERROR, expect.anything());
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Interval called');
  });

  it('should call onAction', async () => {
    testPlatform = new TestPlatform(matterbridge, log, config);
    testPlatform['name'] = 'matterbridge-jest';
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    await testPlatform.onAction('Test action');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Received action'));
    await testPlatform.onAction('turnOn');
    await testPlatform.onAction('turnOff');
    await testPlatform.onAction('turnOnDevice', 'Switch 0');
    await testPlatform.onAction('turnOffDevice', 'Switch 0');
    await testPlatform.onAction('turnOnDevice', 'Switch');
    await testPlatform.onAction('turnOffDevice', 'Switch');
  });

  it('should call onChangeLoggerLevel', async () => {
    testPlatform = new TestPlatform(matterbridge, log, config);
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    await testPlatform.onChangeLoggerLevel(LogLevel.DEBUG);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Logger level set to: debug'));
  });

  it('should call onConfigChanged', async () => {
    testPlatform = new TestPlatform(matterbridge, log, config);
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    await testPlatform.onConfigChanged({} as PlatformConfig);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('has been updated'));
  });

  it('should throw error in configure when throwConfigure is true', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, throwConfigure: true });
    testPlatform.version = '1.6.6';
    await expect(testPlatform.onConfigure()).rejects.toThrow('Throwing error in configure');
  });

  it('should call onShutdown with reason', async () => {
    testPlatform = new TestPlatform(matterbridge, log, config);
    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  });

  it('should throw error in shutdown when throwShutdown is true', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, throwShutdown: true });
    await expect(testPlatform.onShutdown()).rejects.toThrow('Throwing error in shutdown');
  });
});

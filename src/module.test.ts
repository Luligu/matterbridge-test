/* eslint-disable jest/no-conditional-expect */

const MATTER_PORT = 6000;
const NAME = 'Platform';
const HOMEDIR = path.join('jest', NAME);

import path from 'node:path';

import { jest } from '@jest/globals';
import { Matterbridge, PlatformConfig } from 'matterbridge';
import { AnsiLogger, LogLevel, TimestampFormat } from 'matterbridge/logger';
import { OnOffCluster, ModeSelectCluster, IdentifyCluster, LevelControlCluster, ColorControlCluster } from 'matterbridge/matter/clusters';
import { Endpoint, ServerNode } from 'matterbridge/matter';
import { AggregatorEndpoint } from 'matterbridge/matter/endpoints';

import initializePlugin, { TestPlatform, TestPlatformConfig } from './module.ts';
import {
  addBridgedEndpointSpy,
  createMatterbridgeEnvironment,
  destroyMatterbridgeEnvironment,
  loggerLogSpy,
  setupTest,
  startMatterbridgeEnvironment,
  stopMatterbridgeEnvironment,
} from './jestHelpers.ts';

// Setup the test environment
setupTest('NAME', false);

describe('TestPlatform', () => {
  let matterbridge: Matterbridge;
  let server: ServerNode<ServerNode.RootEndpoint>;
  let aggregator: Endpoint<AggregatorEndpoint>;
  let testPlatform: TestPlatform;
  let log: AnsiLogger;

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
    matterbridge = await createMatterbridgeEnvironment(NAME);
    [server, aggregator] = await startMatterbridgeEnvironment(matterbridge, MATTER_PORT);
    log = new AnsiLogger({ logName: NAME, logTimestampFormat: TimestampFormat.TIME_MILLIS, logLevel: LogLevel.DEBUG });
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
    await stopMatterbridgeEnvironment(matterbridge, server, aggregator);
    await destroyMatterbridgeEnvironment(matterbridge);
    // Restore all mocks
    jest.restoreAllMocks();
  });

  it('should return an instance of TestPlatform', async () => {
    const result = initializePlugin(matterbridge, log, config);
    expect(result).toBeInstanceOf(TestPlatform);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Initializing platform:', config.name);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Finished initializing platform:', config.name);
    await result.onShutdown();
  });

  it('should initialize platform with config name', () => {
    testPlatform = new TestPlatform(matterbridge, log, config);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Initializing platform:', config.name);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Finished initializing platform:', config.name);
  });

  it('should throw error in load when throwLoad is true', () => {
    expect(() => new TestPlatform(matterbridge, log, { ...config, throwLoad: true })).toThrow('Throwing error in load');
  });

  it('should throw error in load when version is not valid', () => {
    matterbridge.matterbridgeVersion = '1.5.0';
    expect(() => new TestPlatform(matterbridge, log, config)).toThrow(
      'The test plugin requires Matterbridge version >= "3.3.0". Please update Matterbridge to the latest version in the frontend.',
    );
    matterbridge.matterbridgeVersion = '3.3.0';
  });

  it('should call onStart', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, setUpdateInterval: 2 });
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onStart called with reason:', 'Test reason');
    jest.useFakeTimers();
    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');
    jest.advanceTimersByTime(60 * 1000);
    jest.useRealTimers();
    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  }, 30000);

  it('should call onStart with reason', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, setUpdateInterval: 2 });
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onStart called with reason:', 'Test reason');
    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');
    await testPlatform.onShutdown('Test reason');
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onShutdown called with reason:', 'Test reason');
  }, 30000);

  it('should call onStart and invoke commandHandlers', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, setUpdateInterval: 2 });
    testPlatform.version = '1.6.6';
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
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(addBridgedEndpointSpy).not.toHaveBeenCalled();
  });

  it('should throw error in start when throwStart is true', async () => {
    testPlatform = new TestPlatform(matterbridge, log, { ...config, throwStart: true });
    testPlatform.version = '1.6.6';
    await expect(testPlatform.onStart()).rejects.toThrow('Throwing error in start');
  });

  it('should call onConfigure', async () => {
    // @ts-expect-error accessing private member for testing
    matterbridge.plugins._plugins.set('matterbridge-jest', {});
    testPlatform = new TestPlatform(matterbridge, log, config);
    testPlatform['name'] = 'matterbridge-jest';
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();

    jest.useFakeTimers();

    await testPlatform.onConfigure();
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'onConfigure called');

    for (let i = 0; i < 100; i++) {
      jest.advanceTimersByTime(61 * 1000);
      await Promise.resolve();
    }

    jest.useRealTimers();

    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, 'Interval called');
    expect(loggerLogSpy).toHaveBeenCalledTimes(314);
    expect(loggerLogSpy).not.toHaveBeenCalledWith(LogLevel.ERROR, expect.anything());
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
    testPlatform.onChangeLoggerLevel(LogLevel.DEBUG);
    expect(loggerLogSpy).toHaveBeenCalledWith(LogLevel.INFO, expect.stringContaining('Logger level set to: debug'));
  });

  it('should call onConfigChanged', async () => {
    testPlatform = new TestPlatform(matterbridge, log, config);
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    testPlatform.onConfigChanged({} as PlatformConfig);
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

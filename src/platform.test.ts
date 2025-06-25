/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Matterbridge, MatterbridgeEndpoint, PlatformConfig } from 'matterbridge';
import { AnsiLogger, LogLevel } from 'matterbridge/logger';
import { OnOffCluster, ModeSelectCluster, IdentifyCluster, LevelControlCluster, ColorControlCluster } from 'matterbridge/matter/clusters';

import { TestPlatform } from './platform';

import { jest } from '@jest/globals';

describe('TestPlatform', () => {
  let testPlatform: TestPlatform;

  // Spy on and mock AnsiLogger.log
  const loggerLogSpy = jest.spyOn(AnsiLogger.prototype, 'log').mockImplementation((level: string, message: string, ...parameters: any[]) => {
    //
  });

  const mockLog = {
    fatal: jest.fn((message: string, ...parameters: any[]) => {
      // console.error('mockLog.fatal', message, parameters);
    }),
    error: jest.fn((message: string, ...parameters: any[]) => {
      // console.error('mockLog.error', message, parameters);
    }),
    warn: jest.fn((message: string, ...parameters: any[]) => {
      // console.error('mockLog.warn', message, parameters);
    }),
    notice: jest.fn((message: string, ...parameters: any[]) => {
      // console.error('mockLog.notice', message, parameters);
    }),
    info: jest.fn((message: string, ...parameters: any[]) => {
      // console.error('mockLog.info', message, parameters);
    }),
    debug: jest.fn((message: string, ...parameters: any[]) => {
      // console.error('mockLog.debug', message, parameters);
    }),
  } as unknown as AnsiLogger;

  const mockMatterbridge = {
    matterbridgeDirectory: './jest/matterbridge',
    matterbridgePluginDirectory: './jest/plugins',
    systemInformation: { ipv4Address: undefined, ipv6Address: undefined, osRelease: 'xx.xx.xx.xx.xx.xx', nodeVersion: '22.1.10' },
    matterbridgeVersion: '3.0.0',
    edge: true,
    log: mockLog,
    getDevices: jest.fn(() => {
      // console.log('getDevices called');
      return [];
    }),
    getPlugins: jest.fn(() => {
      // console.log('getDevices called');
      return [];
    }),
    addBridgedEndpoint: jest.fn(async (pluginName: string, device: MatterbridgeEndpoint) => {
      // console.log('addBridgedEndpoint called');
    }),
    removeBridgedEndpoint: jest.fn(async (pluginName: string, device: MatterbridgeEndpoint) => {
      // console.log('removeBridgedEndpoint called');
    }),
    removeAllBridgedEndpoints: jest.fn(async (pluginName: string) => {
      // console.log('removeAllBridgedEndpoints called');
    }),
  } as unknown as Matterbridge;

  const mockConfig = {
    name: 'matterbridge-test',
    type: 'DynamicPlatform',
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
    setUpdateInterval: 30,
    enableElectrical: true,
    enablePowerSource: true,
    enableModeSelect: true,
    debug: true,
    unregisterOnShutdown: true,
  } as PlatformConfig;

  beforeAll(() => {
    //
  });

  beforeEach(() => {
    // Reset the mock calls before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup after each test
    if (testPlatform) {
      (testPlatform as any).throwShutdown = false;
      await testPlatform.onShutdown();
    }
  });

  afterAll(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });

  it('should initialize platform with config name', () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, mockConfig);
    expect(mockLog.info).toHaveBeenCalledWith('Initializing platform:', mockConfig.name);
    expect(mockLog.info).toHaveBeenCalledWith('Finished initializing platform:', mockConfig.name);
  });

  it('should throw error in load when throwLoad is true', () => {
    expect(() => new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, throwLoad: true })).toThrow('Throwing error in load');
  });

  it('should throw error in load when version is not valid', () => {
    mockMatterbridge.matterbridgeVersion = '1.5.0';
    expect(() => new TestPlatform(mockMatterbridge, mockLog, mockConfig)).toThrow(
      'The test plugin requires Matterbridge version >= "3.0.0". Please update Matterbridge to the latest version in the frontend.',
    );
    mockMatterbridge.matterbridgeVersion = '3.0.0';
  });

  it('should call onStart in edge mode', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, setUpdateInterval: 2 });
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onStart called with reason:', 'Test reason');
    jest.useFakeTimers();
    await testPlatform.onConfigure();
    expect(mockLog.info).toHaveBeenCalledWith('onConfigure called');
    jest.advanceTimersByTime(60 * 1000);
    jest.useRealTimers();
    await testPlatform.onShutdown('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onShutdown called with reason:', 'Test reason');
  }, 30000);

  it('should call onStart with reason', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, setUpdateInterval: 2 });
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onStart called with reason:', 'Test reason');
    await testPlatform.onConfigure();
    expect(mockLog.info).toHaveBeenCalledWith('onConfigure called');
    await testPlatform.onShutdown('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onShutdown called with reason:', 'Test reason');
  }, 30000);

  it('should call onStart and invoke commandHandlers', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, setUpdateInterval: 2 });
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onStart called with reason:', 'Test reason');

    // Invoke command handlers
    for (const [key, device] of Array.from(testPlatform.bridgedDevices)) {
      if (device.hasClusterServer(IdentifyCluster)) {
        await device.commandHandler.executeHandler('identify', { request: { identifyTime: 1 } } as any);
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received identify command'));
      }

      if (device.hasClusterServer(OnOffCluster)) {
        await device.commandHandler.executeHandler('on', {} as any);
        await device.commandHandler.executeHandler('off', {} as any);
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received on command'));
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received off command'));
      }

      if (device.hasClusterServer(ModeSelectCluster)) {
        await device.commandHandler.executeHandler('changeToMode', { request: { newMode: 1 } } as any);
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received changeToMode command'));
      }

      if (device.hasClusterServer(LevelControlCluster)) {
        await device.commandHandler.executeHandler('moveToLevel', { request: { level: 1 } } as any);
        await device.commandHandler.executeHandler('moveToLevelWithOnOff', { request: { level: 1 } } as any);
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received moveToLevel command'));
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received moveToLevelWithOnOff command'));
      }

      if (device.hasClusterServer(ColorControlCluster)) {
        await device.commandHandler.executeHandler('moveToColor', { request: { colorX: 100, colorY: 100 } } as any);
        await device.commandHandler.executeHandler('moveToHueAndSaturation', { request: { hue: 100, saturation: 100 } } as any);
        await device.commandHandler.executeHandler('moveToHue', { request: { hue: 100 } } as any);
        await device.commandHandler.executeHandler('moveToSaturation', { request: { saturation: 100 } } as any);
        await device.commandHandler.executeHandler('moveToColorTemperature', { request: { colorTemperatureMireds: 470 } } as any);
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received moveToColor command'));
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received moveToHueAndSaturation command'));
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received moveToHue command'));
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received moveToSaturation command'));
        expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received moveToColorTemperature command'));
      }
    }
  }, 30000);

  it('should not register in start when noDevices is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, noDevices: true });
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(mockMatterbridge.addBridgedEndpoint).not.toHaveBeenCalled();
  });

  it('should throw error in start when throwStart is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, throwStart: true });
    testPlatform.version = '1.6.6';
    await expect(testPlatform.onStart()).rejects.toThrow('Throwing error in start');
  });

  it('should call onConfigure', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, mockConfig);
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();

    jest.useFakeTimers();

    await testPlatform.onConfigure();
    expect(mockLog.info).toHaveBeenCalledWith('onConfigure called');

    for (let i = 0; i < 200; i++) {
      jest.advanceTimersByTime(61 * 1000);
      await Promise.resolve();
    }

    jest.useRealTimers();

    expect(mockLog.info).toHaveBeenCalledWith('Interval called');
    expect(loggerLogSpy).toHaveBeenCalled();
  });

  it('should call onAction', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, mockConfig);
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    testPlatform.onAction('Test action');
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received action'));
    testPlatform.onAction('turnOn');
    testPlatform.onAction('turnOff');
    testPlatform.onAction('turnOnDevice', 'Switch 0');
    testPlatform.onAction('turnOffDevice', 'Switch 0');
    testPlatform.onAction('turnOnDevice', 'Switch');
    testPlatform.onAction('turnOffDevice', 'Switch');
  });

  it('should call onChangeLoggerLevel', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, mockConfig);
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    testPlatform.onChangeLoggerLevel(LogLevel.DEBUG);
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Logger level set to: debug'));
  });

  it('should call onConfigChanged', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, mockConfig);
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(loggerLogSpy).toHaveBeenCalled();
    testPlatform.onConfigChanged({});
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('has been updated'));
  });

  it('should throw error in configure when throwConfigure is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, throwConfigure: true });
    testPlatform.version = '1.6.6';
    await expect(testPlatform.onConfigure()).rejects.toThrow('Throwing error in configure');
  });

  it('should call onShutdown with reason', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, mockConfig);
    await testPlatform.onShutdown('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onShutdown called with reason:', 'Test reason');
  });

  it('should throw error in shutdown when throwShutdown is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, throwShutdown: true });
    await expect(testPlatform.onShutdown()).rejects.toThrow('Throwing error in shutdown');
  });
});

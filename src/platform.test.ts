/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AtLeastOne,
  ClusterServerObj,
  ColorControlCluster,
  DeviceTypeDefinition,
  EndpointOptions,
  IdentifyCluster,
  LevelControlCluster,
  Matterbridge,
  MatterbridgeDevice,
  MatterbridgeEndpoint,
  ModeSelectCluster,
  OnOffCluster,
  PlatformConfig,
} from 'matterbridge';
import { AnsiLogger, LogLevel, TimestampFormat } from 'matterbridge/logger';
import { TestPlatform } from './platform';
import { jest } from '@jest/globals';
import { wait } from 'matterbridge/utils';

describe('TestPlatform', () => {
  let mockMatterbridge: Matterbridge;
  let mockLog: AnsiLogger;
  let mockConfig: PlatformConfig;
  let testPlatform: TestPlatform;

  const log = new AnsiLogger({ logName: 'Jest', logTimestampFormat: TimestampFormat.TIME_MILLIS, logLevel: LogLevel.DEBUG });
  log.logLevel = LogLevel.DEBUG;

  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let loggerLogSpy: jest.SpiedFunction<(level: LogLevel, message: string, ...parameters: any[]) => void>;

  async function invokeCommands(cluster: ClusterServerObj, data?: Record<string, boolean | number | bigint | string | object | null | undefined>): Promise<void> {
    const commands = (cluster as any).commands as object;
    for (const [key, value] of Object.entries(commands)) {
      if (typeof value.handler === 'function') await value.handler(data ?? {});
    }
  }

  async function invokeCommand(cluster: ClusterServerObj, command: string, data?: Record<string, boolean | number | bigint | string | object | null | undefined>): Promise<void> {
    const commands = (cluster as any).commands as object;
    for (const [key, value] of Object.entries(commands)) {
      if (key === command && typeof value.handler === 'function') await value.handler(data ?? {});
    }
  }

  beforeAll(() => {
    mockMatterbridge = {
      matterbridgeDirectory: './jest/matterbridge',
      matterbridgePluginDirectory: './jest/plugins',
      systemInformation: { ipv4Address: undefined },
      matterbridgeVersion: '1.6.7',
      getDevices: jest.fn(() => {
        // console.log('getDevices called');
        return [];
      }),
      addBridgedDevice: jest.fn(async (pluginName: string, device: MatterbridgeDevice) => {
        // console.log('addBridgedDevice called');
      }),
      addBridgedEndpoint: jest.fn(async (pluginName: string, device: MatterbridgeEndpoint) => {
        // console.log('addBridgedEndpoint called');
        // await aggregator.add(device);
      }),
      removeBridgedDevice: jest.fn(async (pluginName: string, device: MatterbridgeDevice) => {
        // console.log('removeBridgedDevice called');
      }),
      removeBridgedEndpoint: jest.fn(async (pluginName: string, device: MatterbridgeEndpoint) => {
        // console.log('removeBridgedEndpoint called');
      }),
      removeAllBridgedDevices: jest.fn(async (pluginName: string) => {
        // console.log('removeAllBridgedDevices called');
      }),
      removeAllBridgedEndpoints: jest.fn(async (pluginName: string) => {
        // console.log('removeAllBridgedEndpoints called');
      }),
    } as unknown as Matterbridge;
    mockLog = {
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
    mockConfig = {
      'name': 'matterbridge-test',
      'type': 'DynamicPlatform',
      'delayStart': false,
      'longDelayStart': false,
      'noDevices': false,
      'throwLoad': false,
      'throwStart': false,
      'throwConfigure': false,
      'throwShutdown': false,
      'loadSwitches': 1,
      'loadOutlets': 1,
      'loadLights': 1,
      'setUpdateInterval': 30,
      'enableElectrical': true,
      'enablePowerSource': true,
      'enableModeSelect': true,
      'debug': false,
      'unregisterOnShutdown': true,
    } as PlatformConfig;

    // Spy on and mock the AnsiLogger.log method
    loggerLogSpy = jest.spyOn(AnsiLogger.prototype, 'log').mockImplementation((level: string, message: string, ...parameters: any[]) => {
      // console.error(`Mocked AnsiLogger.log: ${level} - ${message}`, ...parameters);
    });

    // Spy on and mock console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation((...args: any[]) => {
      // console.error('Mocked console.log', args);
    });
  });

  beforeEach(() => {
    // Reset the mock calls before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    if (testPlatform) {
      (testPlatform as any).throwShutdown = false;
      testPlatform.onShutdown();
    }
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
      'The test plugin requires Matterbridge version >= "1.6.6". Please update Matterbridge to the latest version in the frontend.',
    );
    mockMatterbridge.matterbridgeVersion = '1.6.6';
  });

  it('should call onStart in edge mode', async () => {
    mockMatterbridge.edge = true;
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
    mockMatterbridge.edge = false;
  }, 30000);

  it('should call onStart with reason', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, setUpdateInterval: 2 });
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onStart called with reason:', 'Test reason');
    await testPlatform.onConfigure();
    expect(mockLog.info).toHaveBeenCalledWith('onConfigure called');
    await wait(5000);
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
      const identify = device.getClusterServer(IdentifyCluster);
      expect(identify).toBeDefined();
      if (identify) await invokeCommands(identify as unknown as ClusterServerObj, { endpoint: { number: 100 } });

      const onOff = device.getClusterServer(OnOffCluster);
      expect(onOff).toBeDefined();
      if (onOff) await invokeCommands(onOff as unknown as ClusterServerObj, { endpoint: { number: 100 } });

      if (device.hasClusterServer(ModeSelectCluster)) {
        const modeSelect = device.getClusterServer(ModeSelectCluster);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(modeSelect).toBeDefined();
        if (modeSelect) await invokeCommands(modeSelect as unknown as ClusterServerObj, { endpoint: { number: 100 } });
      }

      if (device.hasClusterServer(LevelControlCluster)) {
        const levelControl = device.getClusterServer(LevelControlCluster);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(levelControl).toBeDefined();
        if (levelControl) await invokeCommands(levelControl as unknown as ClusterServerObj, { endpoint: { number: 100 } });
      }

      if (device.hasClusterServer(ColorControlCluster)) {
        const colorControl = device.getClusterServer(ColorControlCluster);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(colorControl).toBeDefined();
        if (colorControl) await invokeCommands(colorControl as unknown as ClusterServerObj, { endpoint: { number: 100 } });
      }
    }
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received identify command'));
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received on command'));
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Received off command'));
  }, 30000);

  it('should not register in start when noDevices is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, noDevices: true });
    testPlatform.version = '1.6.6';
    await testPlatform.onStart('Test reason');
    expect(mockMatterbridge.addBridgedDevice).not.toHaveBeenCalled();
  });

  it('should throw error in start when throwStart is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, throwStart: true });
    testPlatform.version = '1.6.6';
    await expect(testPlatform.onStart()).rejects.toThrow('Throwing error in start');
  });

  it('should call onConfigure', async () => {
    jest.useFakeTimers();

    await testPlatform.onConfigure();
    expect(mockLog.info).toHaveBeenCalledWith('onConfigure called');

    jest.advanceTimersByTime(60 * 1000);
    jest.useRealTimers();
  });

  it('should throw error in configure when throwConfigure is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, throwConfigure: true });
    testPlatform.version = '1.6.6';
    await expect(testPlatform.onConfigure()).rejects.toThrow('Throwing error in configure');
  });

  it('should call onShutdown with reason', async () => {
    await testPlatform.onShutdown('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onShutdown called with reason:', 'Test reason');
  });

  it('should throw error in shutdown when throwShutdown is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, throwShutdown: true });
    await expect(testPlatform.onShutdown()).rejects.toThrow('Throwing error in shutdown');
  });
});

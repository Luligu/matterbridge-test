import { ClusterServerObj, ColorControlCluster, IdentifyCluster, LevelControlCluster, Matterbridge, ModeSelectCluster, OnOffCluster, PlatformConfig } from 'matterbridge';
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  function invokeCommands(cluster: ClusterServerObj): void {
    // console.log('Cluster commands:', cluster);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commands = (cluster as any).commands as object;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(commands).forEach(([key, value]) => {
      // console.log(`Key "${key}": ${value}`, typeof value.handler, value.handler);
      if (typeof value.handler === 'function') value.handler({});
    });
  }

  beforeAll(() => {
    mockMatterbridge = {
      addBridgedDevice: jest.fn(),
      matterbridgeDirectory: '',
      matterbridgePluginDirectory: 'temp',
      systemInformation: { ipv4Address: undefined },
      matterbridgeVersion: '1.6.2',
      removeAllBridgedDevices: jest.fn(),
    } as unknown as Matterbridge;
    mockLog = { fatal: jest.fn(), error: jest.fn(), warn: jest.fn(), notice: jest.fn(), info: jest.fn(), debug: jest.fn() } as unknown as AnsiLogger;
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
      'enableElectrical': true,
      'enablePowerSource': true,
      'enableModeSelect': true,
      'debug': false,
      'unregisterOnShutdown': true,
    } as PlatformConfig;

    // Spy on and mock console.log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation((...args: any[]) => {
      // console.error(args);
    });
  });

  beforeEach(() => {
    // Reset the mock calls before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    if (testPlatform) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      'The test plugin requires Matterbridge version >= "1.6.2". Please update Matterbridge to the latest version in the frontend.',
    );
    mockMatterbridge.matterbridgeVersion = '1.6.2';
  });

  it('should call onStart with reason', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, setUpdateInterval: 2 });
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
    await testPlatform.onStart('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onStart called with reason:', 'Test reason');

    // Invoke command handlers
    testPlatform.bridgedDevices.forEach((device) => {
      const identify = device.getClusterServer(IdentifyCluster);
      expect(identify).toBeDefined();
      if (identify) invokeCommands(identify as unknown as ClusterServerObj);

      const onOff = device.getClusterServer(OnOffCluster);
      expect(onOff).toBeDefined();
      if (onOff) invokeCommands(onOff as unknown as ClusterServerObj);

      if (device.hasClusterServer(ModeSelectCluster)) {
        const modeSelect = device.getClusterServer(ModeSelectCluster);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(modeSelect).toBeDefined();
        if (modeSelect) invokeCommands(modeSelect as unknown as ClusterServerObj);
      }

      if (device.hasClusterServer(LevelControlCluster)) {
        const levelControl = device.getClusterServer(LevelControlCluster);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(levelControl).toBeDefined();
        if (levelControl) invokeCommands(levelControl as unknown as ClusterServerObj);
      }

      if (device.hasClusterServer(ColorControlCluster)) {
        const colorControl = device.getClusterServer(ColorControlCluster);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(colorControl).toBeDefined();
        if (colorControl) invokeCommands(colorControl as unknown as ClusterServerObj);
      }
    });
    expect(mockLog.info).toHaveBeenCalledWith('Received on command');
  }, 30000);

  it('should not register in start when noDevices is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, noDevices: true });
    await testPlatform.onStart('Test reason');
    expect(mockMatterbridge.addBridgedDevice).not.toHaveBeenCalled();
  });

  it('should throw error in start when throwStart is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, throwStart: true });
    await expect(testPlatform.onStart()).rejects.toThrow('Throwing error in start');
  });

  it('should call onConfigure', async () => {
    await testPlatform.onConfigure();
    expect(mockLog.info).toHaveBeenCalledWith('onConfigure called');
  });

  it('should throw error in configure when throwConfigure is true', async () => {
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, { ...mockConfig, throwConfigure: true });
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

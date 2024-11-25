import { Matterbridge, PlatformConfig } from 'matterbridge';
import { AnsiLogger } from 'matterbridge/logger';
import { TestPlatform } from './platform';
import { jest } from '@jest/globals';

describe('TestPlatform', () => {
  let mockMatterbridge: Matterbridge;
  let mockLog: AnsiLogger;
  let mockConfig: PlatformConfig;
  let testPlatform: TestPlatform;

  // const log = new AnsiLogger({ logName: 'shellyDeviceTest', logTimestampFormat: TimestampFormat.TIME_MILLIS, logDebug: true });

  beforeEach(() => {
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
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, mockConfig);
  });

  it('should initialize platform with config name', () => {
    mockConfig.noDevices = true;
    mockConfig.delayStart = true;
    testPlatform = new TestPlatform(mockMatterbridge, mockLog, mockConfig);
    expect(mockLog.info).toHaveBeenCalledWith('Initializing platform:', mockConfig.name);
  });

  it('should finish initializing platform with config name', () => {
    expect(mockLog.info).toHaveBeenCalledWith('Finished initializing platform:', mockConfig.name);
  });

  it('should throw error in load when throwLoad is true', () => {
    mockConfig.throwLoad = true;
    expect(() => new TestPlatform(mockMatterbridge, mockLog, mockConfig)).toThrow('Throwing error in load');
  });

  it('should throw error in load when version is not valid', () => {
    mockMatterbridge.matterbridgeVersion = '1.5.0';
    expect(() => new TestPlatform(mockMatterbridge, mockLog, mockConfig)).toThrow(
      'The test plugin requires Matterbridge version >= "1.6.0". Please update Matterbridge to the latest version in the frontend.',
    );
    mockMatterbridge.matterbridgeVersion = '1.6.2';
  });

  it('should call onStart with reason', async () => {
    await testPlatform.onStart('Test reason');
    expect(mockLog.info).toHaveBeenCalledWith('onStart called with reason:', 'Test reason');
  });

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

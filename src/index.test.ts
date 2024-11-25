import { Matterbridge, PlatformConfig } from 'matterbridge';
import { AnsiLogger } from 'matterbridge/logger';
import { TestPlatform } from './platform.js';
import initializePlugin from './index';
import { jest } from '@jest/globals';

describe('initializePlugin', () => {
  let mockMatterbridge: Matterbridge;
  let mockLog: AnsiLogger;
  let mockConfig: PlatformConfig;

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
      'loadSwitches': 0,
      'loadOutlets': 0,
      'loadLights': 0,
      'enableElectrical': false,
      'enablePowerSource': false,
      'enableModeSelect': false,
      'debug': false,
      'unregisterOnShutdown': false,
    } as PlatformConfig;
  });

  it('should return an instance of TestPlatform', () => {
    const result = initializePlugin(mockMatterbridge, mockLog, mockConfig);
    expect(result).toBeInstanceOf(TestPlatform);
  });
});

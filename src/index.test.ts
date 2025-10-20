import path from 'node:path';

import { jest } from '@jest/globals';
import { Matterbridge, MatterbridgeEndpoint } from 'matterbridge';
import { AnsiLogger } from 'matterbridge/logger';

import { TestPlatform, TestPlatformConfig } from './platform.ts';
import initializePlugin from './index.ts';
import { setupTest } from './jestHelpers.ts';

// Setup the test environment
setupTest('Index', false);

describe('initializePlugin', () => {
  const mockLog = {
    fatal: jest.fn((message: string, ...parameters: any[]) => {}),
    error: jest.fn((message: string, ...parameters: any[]) => {}),
    warn: jest.fn((message: string, ...parameters: any[]) => {}),
    notice: jest.fn((message: string, ...parameters: any[]) => {}),
    info: jest.fn((message: string, ...parameters: any[]) => {}),
    debug: jest.fn((message: string, ...parameters: any[]) => {}),
  } as unknown as AnsiLogger;

  const mockConfig: TestPlatformConfig = {
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
    loadSwitches: 0,
    loadOutlets: 0,
    loadLights: 0,
    whiteList: [],
    blackList: [],
    setUpdateInterval: 30,
    enableElectrical: false,
    enablePowerSource: false,
    enableModeSelect: false,
    enableReachable: false,
    debug: false,
    unregisterOnShutdown: false,
  };

  const mockMatterbridge = {
    homeDirectory: path.join('jest', 'index'),
    matterbridgeDirectory: path.join('jest', 'index', '.matterbridge'),
    matterbridgePluginDirectory: path.join('jest', 'index', 'Matterbridge'),
    systemInformation: { ipv4Address: undefined, ipv6Address: undefined, osRelease: 'xx.xx.xx.xx.xx.xx', nodeVersion: '22.1.10' },
    matterbridgeVersion: '3.3.0',
    edge: true,
    log: mockLog,
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

  beforeAll(() => {
    //
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    //
  });

  afterAll(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });

  it('should return an instance of TestPlatform', async () => {
    const result = initializePlugin(mockMatterbridge, mockLog, mockConfig);
    expect(result).toBeInstanceOf(TestPlatform);
    expect(mockLog.info).toHaveBeenCalledWith('Initializing platform:', mockConfig.name);
    expect(mockLog.info).toHaveBeenCalledWith('Finished initializing platform:', mockConfig.name);
    await result.onShutdown();
  });
});

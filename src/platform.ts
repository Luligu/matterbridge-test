import {
  Matterbridge,
  MatterbridgeDynamicPlatform,
  PlatformConfig,
  bridgedNode,
  electricalSensor,
  onOffSwitch,
  onOffOutlet,
  colorTemperatureLight,
  powerSource,
  modeSelect,
  MatterbridgeEndpoint,
  BridgedDeviceBasicInformationCluster,
} from 'matterbridge';
import { waiter } from 'matterbridge/utils';
import { AnsiLogger } from 'matterbridge/logger';
import { OnOffCluster, ElectricalPowerMeasurementCluster, ElectricalEnergyMeasurementCluster, ModeSelectCluster, PowerSourceCluster } from 'matterbridge/matter/clusters';

export class TestPlatform extends MatterbridgeDynamicPlatform {
  // Config
  private noDevices = false;
  private delayStart = false;
  private loadSwitches = 0;
  private loadOutlets = 0;
  private loadLights = 0;
  private setUpdateInterval = 0;
  private throwLoad = false;
  private throwStart = false;
  private throwConfigure = false;
  private throwShutdown = false;
  private enableElectrical = false;
  private enableModeSelect = false;
  private enablePowerSource = false;
  private enableReachable = false;
  private interval: NodeJS.Timeout | undefined;
  bridgedDevices = new Map<string, MatterbridgeEndpoint>();

  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    super(matterbridge, log, config);

    // Verify that Matterbridge is the correct version
    if (this.verifyMatterbridgeVersion === undefined || typeof this.verifyMatterbridgeVersion !== 'function' || !this.verifyMatterbridgeVersion('2.2.0')) {
      throw new Error(`The test plugin requires Matterbridge version >= "2.2.0". Please update Matterbridge to the latest version in the frontend.`);
    }

    this.log.info('Initializing platform:', this.config.name);
    this.log.debug('- with matterbridge version ', matterbridge.matterbridgeVersion);
    this.log.debug('- with config:', this.config);

    if (config.noDevices) this.noDevices = config.noDevices as boolean;
    if (config.delayStart) this.delayStart = config.delayStart as boolean;
    if (config.enableElectrical) this.enableElectrical = config.enableElectrical as boolean;
    if (config.enableModeSelect) this.enableModeSelect = config.enableModeSelect as boolean;
    if (config.enablePowerSource) this.enablePowerSource = config.enablePowerSource as boolean;
    if (config.enableReachable) this.enableReachable = config.enableReachable as boolean;
    if (config.loadSwitches) this.loadSwitches = config.loadSwitches as number;
    if (config.loadOutlets) this.loadOutlets = config.loadOutlets as number;
    if (config.loadLights) this.loadLights = config.loadLights as number;
    if (config.setUpdateInterval) this.setUpdateInterval = config.setUpdateInterval as number;
    if (config.throwLoad) this.throwLoad = config.throwLoad as boolean;
    if (config.throwStart) this.throwStart = config.throwStart as boolean;
    if (config.throwConfigure) this.throwConfigure = config.throwConfigure as boolean;
    if (config.throwShutdown) this.throwShutdown = config.throwShutdown as boolean;

    this.log.debug('- with noDevice:', this.noDevices);
    this.log.debug('- with delayStart:', this.delayStart);
    this.log.debug('- with enableElectrical:', this.enableElectrical);
    this.log.debug('- with enableModeSelect:', this.enableModeSelect);
    this.log.debug('- with enablePowerSource:', this.enablePowerSource);
    this.log.debug('- with loadSwitches:', this.loadSwitches);
    this.log.debug('- with loadOutlets:', this.loadOutlets);
    this.log.debug('- with loadLights:', this.loadLights);
    this.log.debug('- with setUpdateInterval:', this.setUpdateInterval);
    this.log.debug('- with throwLoad:', this.throwLoad);
    this.log.debug('- with throwStart:', this.throwStart);
    this.log.debug('- with throwConfigure:', this.throwConfigure);
    this.log.debug('- with throwShutdown:', this.throwShutdown);

    if (this.throwLoad) throw new Error('Throwing error in load');

    this.log.info('Finished initializing platform:', this.config.name);
  }

  override async onStart(reason?: string): Promise<void> {
    this.log.info('onStart called with reason:', reason ?? 'none');

    if (this.throwStart) throw new Error('Throwing error in start');

    if (this.delayStart) await waiter('Delay start', () => false, false, 20000, 1000);

    if (this.config.longDelayStart) await waiter('Delay start', () => false, false, 60000, 1000);

    for (let i = 0; i < this.loadSwitches; i++) {
      const switchDevice = new MatterbridgeEndpoint(
        [
          onOffSwitch,
          bridgedNode,
          ...(this.enableElectrical ? [electricalSensor] : []),
          ...(this.enablePowerSource ? [powerSource] : []),
          ...(this.enableModeSelect ? [modeSelect] : []),
        ],
        { uniqueStorageKey: 'Switch' + i },
        this.config.debug as boolean,
      );
      switchDevice.log.logName = 'Switch' + i;
      switchDevice.createDefaultBridgedDeviceBasicInformationClusterServer(
        'Switch ' + i,
        'serial_switch_' + i,
        0xfff1,
        'Matterbridge',
        'Matterbridge test plugin',
        parseInt(this.version.replace(/\D/g, '')),
        this.version,
        parseInt(this.matterbridge.matterbridgeVersion.replace(/\D/g, '')),
        this.matterbridge.matterbridgeVersion,
      );
      switchDevice.addCommandHandler('identify', async (data) => {
        this.log.info(`Received identify command request ${data.request.identifyTime} for endpoint ${data.endpoint?.number}`);
      });
      switchDevice.addCommandHandler('on', async (data) => {
        this.log.info(`Received on command for endpoint ${data.endpoint?.number}`);
      });
      switchDevice.addCommandHandler('off', async (data) => {
        this.log.info(`Received off command for endpoint ${data.endpoint?.number}`);
      });
      if (this.enableElectrical) this.addElectricalMeasurements(switchDevice);
      if (this.enablePowerSource) this.addPowerSource(switchDevice);
      if (this.enableModeSelect) {
        this.addModeSelect(switchDevice, 'Switch ' + i);
        switchDevice.addCommandHandler('changeToMode', async (data) => {
          this.log.info(`Received changeToMode command with request ${data.request.newMode} for endpoint ${data.endpoint?.number}`);
        });
      }
      switchDevice.addRequiredClusterServers();
      if (this.noDevices === false) await this.registerDevice(switchDevice);
      this.bridgedDevices.set('Switch' + i, switchDevice);
    }

    for (let i = 0; i < this.loadOutlets; i++) {
      const outletDevice = new MatterbridgeEndpoint(
        [
          onOffOutlet,
          bridgedNode,
          ...(this.enableElectrical ? [electricalSensor] : []),
          ...(this.enablePowerSource ? [powerSource] : []),
          ...(this.enableModeSelect ? [modeSelect] : []),
        ],
        { uniqueStorageKey: 'Outlet' + i },
        this.config.debug as boolean,
      );
      outletDevice.log.logName = 'Outlet' + i;
      outletDevice.createDefaultBridgedDeviceBasicInformationClusterServer(
        'Outlet ' + i,
        'serial_outlet_' + i,
        0xfff1,
        'Matterbridge',
        'Matterbridge test plugin',
        parseInt(this.version.replace(/\D/g, '')),
        this.version,
        parseInt(this.matterbridge.matterbridgeVersion.replace(/\D/g, '')),
        this.matterbridge.matterbridgeVersion,
      );
      outletDevice.addCommandHandler('identify', async (data) => {
        this.log.info(`Received identify command request ${data.request.identifyTime} for endpoint ${data.endpoint?.number}`);
      });
      outletDevice.addCommandHandler('on', async (data) => {
        this.log.info(`Received on command for endpoint ${data.endpoint?.number}`);
      });
      outletDevice.addCommandHandler('off', async (data) => {
        this.log.info(`Received off command for endpoint ${data.endpoint?.number}`);
      });
      if (this.enableElectrical) this.addElectricalMeasurements(outletDevice);
      if (this.enablePowerSource) this.addPowerSource(outletDevice);
      if (this.enableModeSelect) {
        this.addModeSelect(outletDevice, 'Outlet ' + i);
        outletDevice.addCommandHandler('changeToMode', async (data) => {
          this.log.info(`Received command changeToMode with request ${data.request.newMode} for endpoint ${data.endpoint?.number}`);
        });
      }
      outletDevice.addRequiredClusterServers();
      if (this.noDevices === false) await this.registerDevice(outletDevice);
      this.bridgedDevices.set('Outlet' + i, outletDevice);
    }

    for (let i = 0; i < this.loadLights; i++) {
      const lightDevice = new MatterbridgeEndpoint(
        [
          colorTemperatureLight,
          bridgedNode,
          ...(this.enableElectrical ? [electricalSensor] : []),
          ...(this.enablePowerSource ? [powerSource] : []),
          ...(this.enableModeSelect ? [modeSelect] : []),
        ],
        { uniqueStorageKey: 'Light' + i },
        this.config.debug as boolean,
      );
      lightDevice.log.logName = 'Light' + i;
      lightDevice.createDefaultBridgedDeviceBasicInformationClusterServer(
        'Light ' + i,
        'serial_light_' + i,
        0xfff1,
        'Matterbridge',
        'Matterbridge test plugin',
        parseInt(this.version.replace(/\D/g, '')),
        this.version,
        parseInt(this.matterbridge.matterbridgeVersion.replace(/\D/g, '')),
        this.matterbridge.matterbridgeVersion,
      );
      lightDevice.addCommandHandler('identify', async (data) => {
        this.log.info(`Received identify command request ${data.request.identifyTime} for endpoint ${data.endpoint?.number}`);
      });
      lightDevice.addCommandHandler('on', async (data) => {
        this.log.info(`Received on command for endpoint ${data.endpoint?.number}`);
      });
      lightDevice.addCommandHandler('off', async (data) => {
        this.log.info(`Received off command for endpoint ${data.endpoint?.number}`);
      });
      lightDevice.addCommandHandler('moveToLevel', async (data) => {
        this.log.info(`Received moveToLevel command request ${data.request.level} for endpoint ${data.endpoint?.number}`);
      });
      lightDevice.addCommandHandler('moveToLevelWithOnOff', async (data) => {
        this.log.info(`Received moveToLevelWithOnOff command request ${data.request.level} for endpoint ${data.endpoint?.number}`);
      });
      lightDevice.addCommandHandler('moveToColor', async ({ request: { colorX, colorY } }) => {
        this.log.info(`Received moveToColor command request X ${colorX / 65536} Y ${colorY / 65536}`);
      });
      lightDevice.addCommandHandler('moveToHueAndSaturation', async ({ request: { hue, saturation } }) => {
        this.log.info(`Received moveToHueAndSaturation command request hue ${hue} saturation ${saturation}`);
      });
      lightDevice.addCommandHandler('moveToHue', async ({ request: { hue } }) => {
        this.log.info(`Received moveToHue command request ${hue}`);
      });
      lightDevice.addCommandHandler('moveToSaturation', async ({ request: { saturation } }) => {
        this.log.info(`Received moveToSaturation command request ${saturation}`);
      });
      lightDevice.addCommandHandler('moveToColorTemperature', async ({ request }) => {
        this.log.info(`Received moveToColorTemperature command request ${request.colorTemperatureMireds}`);
      });

      if (this.enableElectrical) this.addElectricalMeasurements(lightDevice);
      if (this.enablePowerSource) this.addPowerSource(lightDevice);
      if (this.enableModeSelect) {
        this.addModeSelect(lightDevice, 'Light ' + i);
        lightDevice.addCommandHandler('changeToMode', async (data) => {
          this.log.info(`Received command changeToMode with request ${data.request.newMode} for endpoint ${data.endpoint?.number}`);
        });
      }
      lightDevice.addRequiredClusterServers();
      if (this.noDevices === false) await this.registerDevice(lightDevice);
      this.bridgedDevices.set('Light' + i, lightDevice);
    }

    /*
    const energy = new MatterbridgeDevice([deviceEnergyManagement, bridgedNode], undefined, this.config.debug as boolean);
    energy.createDefaultBridgedDeviceBasicInformationClusterServer('Device Energy Management', 'serial_98745631227', 0xfff1, 'Test plugin', 'deviceEnergyManagement', 2, '2.1.1');
    energy.addDeviceTypeWithClusterServer([deviceEnergyManagement], [DeviceEnergyManagement.Cluster.id, DeviceEnergyManagementMode.Cluster.id]);
    energy.addCommandHandler('changeToMode', async ({ request: { newMode }, attributes: { currentMode } }) => {
      this.log.info('Received changeToMode command with mode:', newMode, 'current mode:', currentMode.getLocal());
      energy.setAttribute(DeviceEnergyManagementModeCluster.id, 'currentMode', newMode, energy.log);
    });
    if (!this.noDevices) await this.registerDevice(energy);
    */
  }

  addElectricalMeasurements(device: MatterbridgeEndpoint): void {
    device.createDefaultPowerTopologyClusterServer();
    device.createDefaultElectricalPowerMeasurementClusterServer(220 * 1000, 2.5 * 1000, 220 * 2.5 * 1000, 50 * 1000);
    device.createDefaultElectricalEnergyMeasurementClusterServer(1500 * 1000);
  }

  addModeSelect(device: MatterbridgeEndpoint, description: string): void {
    device.createDefaultModeSelectClusterServer(
      description + ' Led Mode Select',
      [
        { label: 'Led ON', mode: 1, semanticTags: [] },
        { label: 'Led OFF', mode: 2, semanticTags: [] },
      ],
      1,
      1,
    );
  }

  addPowerSource(device: MatterbridgeEndpoint): void {
    device.createDefaultPowerSourceReplaceableBatteryClusterServer(100);
  }

  override async onConfigure(): Promise<void> {
    await super.onConfigure();
    this.log.info('onConfigure called');
    if (this.throwConfigure) throw new Error('Throwing error in configure');

    if (this.setUpdateInterval === 0) return;

    const getRandomNumberInRange = (min: number, max: number): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    this.interval = setInterval(async () => {
      this.log.info('Interval called');
      for (let i = 0; i < this.loadSwitches; i++) {
        const device = this.bridgedDevices.get('Switch' + i);
        const state = device?.getAttribute(OnOffCluster.id, 'onOff');
        await device?.setAttribute(OnOffCluster.id, 'onOff', !state, device?.log);
        if (this.enableReachable) await device?.setAttribute(BridgedDeviceBasicInformationCluster.id, 'reachable', state, device?.log);
        if (this.enableElectrical) {
          const voltage = getRandomNumberInRange(220, 240);
          const current = getRandomNumberInRange(20, 30);
          await device?.setAttribute(ElectricalPowerMeasurementCluster.id, 'voltage', voltage * 1000, device.log);
          await device?.setAttribute(ElectricalPowerMeasurementCluster.id, 'activeCurrent', current * 1000, device.log);
          await device?.setAttribute(ElectricalPowerMeasurementCluster.id, 'activePower', voltage * current * 1000, device.log);
          const cumulativeEnergy = device?.getAttribute(ElectricalEnergyMeasurementCluster.id, 'cumulativeEnergyImported', device.log);
          await device?.setAttribute(
            ElectricalEnergyMeasurementCluster.id,
            'cumulativeEnergyImported',
            { energy: cumulativeEnergy ? cumulativeEnergy.energy + 1000 : 1500 * 1000 },
            device.log,
          );
        }
        if (this.enableModeSelect) {
          const currentMode = device?.getAttribute(ModeSelectCluster.id, 'currentMode', device?.log);
          await device?.setAttribute(ModeSelectCluster.id, 'currentMode', currentMode === 1 ? 2 : 1, device?.log);
        }
        if (this.enablePowerSource) {
          const battery = device?.getAttribute(PowerSourceCluster.id, 'batPercentRemaining', device?.log);
          await device?.setAttribute(PowerSourceCluster.id, 'batPercentRemaining', battery + 20 > 200 ? 20 : battery + 20, device?.log);
        }
      }
      for (let i = 0; i < this.loadOutlets; i++) {
        const device = this.bridgedDevices.get('Outlet' + i);
        const state = device?.getAttribute(OnOffCluster.id, 'onOff');
        await device?.setAttribute(OnOffCluster.id, 'onOff', !state, device?.log);
        if (this.enableReachable) await device?.setAttribute(BridgedDeviceBasicInformationCluster.id, 'reachable', state, device?.log);
        if (this.enableElectrical) {
          const voltage = getRandomNumberInRange(220, 240);
          const current = getRandomNumberInRange(20, 30);
          await device?.setAttribute(ElectricalPowerMeasurementCluster.id, 'voltage', voltage * 1000, device.log);
          await device?.setAttribute(ElectricalPowerMeasurementCluster.id, 'activeCurrent', current * 1000, device.log);
          await device?.setAttribute(ElectricalPowerMeasurementCluster.id, 'activePower', voltage * current * 1000, device.log);
          const cumulativeEnergy = device?.getAttribute(ElectricalEnergyMeasurementCluster.id, 'cumulativeEnergyImported', device.log);
          await device?.setAttribute(
            ElectricalEnergyMeasurementCluster.id,
            'cumulativeEnergyImported',
            { energy: cumulativeEnergy ? cumulativeEnergy.energy + 1000 : 1500 * 1000 },
            device.log,
          );
        }
        if (this.enableModeSelect) {
          const currentMode = device?.getAttribute(ModeSelectCluster.id, 'currentMode', device?.log);
          await device?.setAttribute(ModeSelectCluster.id, 'currentMode', currentMode === 1 ? 2 : 1, device?.log);
        }
        if (this.enablePowerSource) {
          const battery = device?.getAttribute(PowerSourceCluster.id, 'batPercentRemaining', device?.log);
          await device?.setAttribute(PowerSourceCluster.id, 'batPercentRemaining', battery + 20 > 200 ? 20 : battery + 20, device?.log);
        }
      }
      for (let i = 0; i < this.loadLights; i++) {
        const device = this.bridgedDevices.get('Light' + i);
        const state = device?.getAttribute(OnOffCluster.id, 'onOff');
        await device?.setAttribute(OnOffCluster.id, 'onOff', !state, device?.log);
        if (this.enableReachable) await device?.setAttribute(BridgedDeviceBasicInformationCluster.id, 'reachable', state, device?.log);
        if (this.enableElectrical) {
          const voltage = getRandomNumberInRange(220, 240);
          const current = getRandomNumberInRange(20, 30);
          await device?.setAttribute(ElectricalPowerMeasurementCluster.id, 'voltage', voltage * 1000, device.log);
          await device?.setAttribute(ElectricalPowerMeasurementCluster.id, 'activeCurrent', current * 1000, device.log);
          await device?.setAttribute(ElectricalPowerMeasurementCluster.id, 'activePower', voltage * current * 1000, device.log);
          const cumulativeEnergy = device?.getAttribute(ElectricalEnergyMeasurementCluster.id, 'cumulativeEnergyImported', device.log);
          await device?.setAttribute(
            ElectricalEnergyMeasurementCluster.id,
            'cumulativeEnergyImported',
            { energy: cumulativeEnergy ? cumulativeEnergy.energy + 1000 : 1500 * 1000 },
            device.log,
          );
        }
        if (this.enableModeSelect) {
          const currentMode = device?.getAttribute(ModeSelectCluster.id, 'currentMode', device?.log);
          await device?.setAttribute(ModeSelectCluster.id, 'currentMode', currentMode === 1 ? 2 : 1, device?.log);
        }
        if (this.enablePowerSource) {
          const battery = device?.getAttribute(PowerSourceCluster.id, 'batPercentRemaining', device?.log);
          await device?.setAttribute(PowerSourceCluster.id, 'batPercentRemaining', battery + 20 > 200 ? 20 : battery + 20, device?.log);
        }
      }
    }, this.setUpdateInterval * 1000);
  }

  override async onShutdown(reason?: string): Promise<void> {
    await super.onShutdown(reason);
    this.log.info('onShutdown called with reason:', reason ?? 'none');
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
    if (this.throwShutdown) throw new Error('Throwing error in shutdown');
  }
}

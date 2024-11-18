import {
  Matterbridge,
  MatterbridgeDevice,
  // MatterbridgeEndpoint as MatterbridgeDevice,
  MatterbridgeDynamicPlatform,
  PlatformConfig,
  bridgedNode,
  electricalSensor,
  ElectricalPowerMeasurement,
  ElectricalEnergyMeasurement,
  onOffSwitch,
  onOffOutlet,
  ElectricalPowerMeasurementCluster,
  ElectricalEnergyMeasurementCluster,
  PowerSource,
  colorTemperatureLight,
  DeviceTypeDefinition,
  EndpointOptions,
  AtLeastOne,
  MatterbridgeEndpoint,
  OnOffCluster,
} from 'matterbridge';

import { waiter } from 'matterbridge/utils';

import { AnsiLogger } from 'matterbridge/logger';

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
  private interval: NodeJS.Timeout | undefined;
  private bridgedDevices = new Map<string, MatterbridgeDevice>();

  createMutableDevice(definition: DeviceTypeDefinition | AtLeastOne<DeviceTypeDefinition>, options: EndpointOptions = {}, debug = false): MatterbridgeDevice {
    let device: MatterbridgeDevice | MatterbridgeEndpoint;
    if ('edge' in this.matterbridge && this.matterbridge.edge === true) device = new MatterbridgeEndpoint(definition, options, debug);
    else device = new MatterbridgeDevice(definition, options, debug);
    return device as unknown as MatterbridgeDevice;
  }

  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    super(matterbridge, log, config);

    // Verify that Matterbridge is the correct version
    if (this.verifyMatterbridgeVersion === undefined || typeof this.verifyMatterbridgeVersion !== 'function' || !this.verifyMatterbridgeVersion('1.6.0')) {
      throw new Error(`The test plugin requires Matterbridge version >= "1.6.0". Please update Matterbridge to the latest version in the frontend.`);
    }

    this.log.info('Initializing platform:', this.config.name);

    if (config.noDevices) this.noDevices = config.noDevices as boolean;
    if (config.delayStart) this.delayStart = config.delayStart as boolean;
    if (config.enableElectrical) this.enableElectrical = config.enableElectrical as boolean;
    if (config.enableModeSelect) this.enableModeSelect = config.enableModeSelect as boolean;
    if (config.enablePowerSource) this.enablePowerSource = config.enablePowerSource as boolean;
    if (config.loadSwitches) this.loadSwitches = config.loadSwitches as number;
    if (config.loadOutlets) this.loadOutlets = config.loadOutlets as number;
    if (config.loadLights) this.loadLights = config.loadLights as number;
    if (config.setUpdateInterval) this.setUpdateInterval = config.setUpdateInterval as number;
    if (config.throwLoad) this.throwLoad = config.throwLoad as boolean;
    if (config.throwStart) this.throwStart = config.throwStart as boolean;
    if (config.throwConfigure) this.throwConfigure = config.throwConfigure as boolean;
    if (config.throwShutdown) this.throwShutdown = config.throwShutdown as boolean;

    if (this.throwLoad) throw new Error('Throwing error in load');

    this.log.info('Finished initializing platform:', this.config.name);
  }

  override async onStart(reason?: string): Promise<void> {
    this.log.info('onStart called with reason:', reason ?? 'none');

    if (this.throwStart) throw new Error('Throwing error in start');

    if (this.delayStart) await waiter('Delay start', () => false, false, 20000, 1000);

    if (this.config.longDelayStart) await waiter('Delay start', () => false, false, 60000, 1000);

    for (let i = 0; i < this.loadSwitches; i++) {
      // const switchDevice = new MatterbridgeDevice([onOffSwitch, bridgedNode], { uniqueStorageKey: 'Switch' + i }, this.config.debug as boolean);
      const switchDevice = this.createMutableDevice([onOffSwitch, bridgedNode], { uniqueStorageKey: 'Switch' + i });
      switchDevice.createDefaultBridgedDeviceBasicInformationClusterServer('Switch ' + i, 'serial_switch_' + i, 0xfff1, 'Test plugin', 'Matterbridge');
      switchDevice.addDeviceTypeWithClusterServer([onOffSwitch], []);
      switchDevice.addCommandHandler('on', async () => {
        this.log.info('Received on command');
      });
      switchDevice.addCommandHandler('off', async () => {
        this.log.info('Received off command');
      });
      if (this.enableElectrical) this.addElectricalMeasurements(switchDevice);
      if (this.enablePowerSource) this.addPowerSource(switchDevice);
      if (this.enableModeSelect) this.addModeSelect(switchDevice, 'Switch ' + i);
      if (!this.noDevices) await this.registerDevice(switchDevice);
      this.bridgedDevices.set('Switch' + i, switchDevice);
    }

    for (let i = 0; i < this.loadOutlets; i++) {
      // const outletDevice = new MatterbridgeDevice([onOffOutlet, bridgedNode], { uniqueStorageKey: 'Outlet' + i }, this.config.debug as boolean);
      const outletDevice = this.createMutableDevice([onOffOutlet, bridgedNode], { uniqueStorageKey: 'Outlet' + i });
      outletDevice.createDefaultBridgedDeviceBasicInformationClusterServer('Outlet ' + i, 'serial_outlet_' + i, 0xfff1, 'Test plugin', 'Matterbridge');
      outletDevice.addDeviceTypeWithClusterServer([onOffOutlet], []);
      outletDevice.addCommandHandler('on', async () => {
        this.log.info('Received on command');
      });
      outletDevice.addCommandHandler('off', async () => {
        this.log.info('Received off command');
      });
      if (this.enableElectrical) this.addElectricalMeasurements(outletDevice);
      if (this.enablePowerSource) this.addPowerSource(outletDevice);
      if (this.enableModeSelect) this.addModeSelect(outletDevice, 'Outlet ' + i);
      if (!this.noDevices) await this.registerDevice(outletDevice);
      this.bridgedDevices.set('Outlet' + i, outletDevice);
    }

    for (let i = 0; i < this.loadLights; i++) {
      // const lightDevice = new MatterbridgeDevice([colorTemperatureLight, bridgedNode], { uniqueStorageKey: 'Light' + i }, this.config.debug as boolean);
      const lightDevice = this.createMutableDevice([colorTemperatureLight, bridgedNode], { uniqueStorageKey: 'Light' + i });
      lightDevice.createDefaultBridgedDeviceBasicInformationClusterServer('Light ' + i, 'serial_light_' + i, 0xfff1, 'Test plugin', 'Matterbridge');
      lightDevice.addDeviceTypeWithClusterServer([colorTemperatureLight], []);
      lightDevice.addCommandHandler('on', async () => {
        this.log.info('Received on command');
      });
      lightDevice.addCommandHandler('off', async () => {
        this.log.info('Received off command');
      });
      lightDevice.addCommandHandler('moveToLevel', async (data) => {
        this.log.info('Received moveTolevel command request:', data.request.level);
      });
      lightDevice.addCommandHandler('moveToLevelWithOnOff', async (data) => {
        this.log.info('Received moveTolevel command request:', data.request.level);
      });
      lightDevice.addCommandHandler('moveToColor', async ({ request: { colorX, colorY } }) => {
        lightDevice?.log.debug(`Command moveToColor called request: X ${colorX / 65536} Y ${colorY / 65536}`);
      });
      lightDevice.addCommandHandler('moveToHueAndSaturation', async ({ request: { hue, saturation } }) => {
        lightDevice?.log.debug(`Command moveToHueAndSaturation called request: hue ${hue} saturation ${saturation}`);
      });
      lightDevice.addCommandHandler('moveToHue', async ({ request: { hue } }) => {
        lightDevice?.log.debug(`Command moveToHue called request: ${hue}`);
      });
      lightDevice.addCommandHandler('moveToSaturation', async ({ request: { saturation } }) => {
        lightDevice?.log.debug(`Command moveToSaturation called request: ${saturation}`);
      });
      lightDevice.addCommandHandler('moveToColorTemperature', async ({ request }) => {
        lightDevice?.log.debug(`Command moveToColorTemperature called request: ${request.colorTemperatureMireds}`);
      });

      if (this.enableElectrical) this.addElectricalMeasurements(lightDevice);
      if (this.enablePowerSource) this.addPowerSource(lightDevice);
      if (this.enableModeSelect) this.addModeSelect(lightDevice, 'Light ' + i);
      if (!this.noDevices) await this.registerDevice(lightDevice);
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

  addElectricalMeasurements(device: MatterbridgeDevice): void {
    device.addDeviceTypeWithClusterServer([electricalSensor], [ElectricalPowerMeasurement.Cluster.id, ElectricalEnergyMeasurement.Cluster.id]);
    device.setAttribute(ElectricalPowerMeasurementCluster.id, 'voltage', 220 * 1000, device.log);
    device.setAttribute(ElectricalPowerMeasurementCluster.id, 'activeCurrent', 2.5 * 1000, device.log);
    device.setAttribute(ElectricalPowerMeasurementCluster.id, 'activePower', 220 * 2.5 * 1000, device.log);
    device.setAttribute(ElectricalEnergyMeasurementCluster.id, 'cumulativeEnergyImported', { energy: 1500 * 1000 }, device.log);
  }

  addModeSelect(device: MatterbridgeDevice, description: string): void {
    device.addClusterServer(
      device.getDefaultModeSelectClusterServer(
        description,
        [
          { label: 'Led ON', mode: 1, semanticTags: [] },
          { label: 'Led OFF', mode: 2, semanticTags: [] },
        ],
        1,
        1,
      ),
    );
  }

  addPowerSource(device: MatterbridgeDevice): void {
    device.addClusterServer(device.getDefaultPowerSourceWiredClusterServer(PowerSource.WiredCurrentType.Ac));
  }

  override async onConfigure(): Promise<void> {
    this.log.info('onConfigure called');
    if (this.throwConfigure) throw new Error('Throwing error in configure');

    if (this.setUpdateInterval === 0) return;

    this.interval = setInterval(async () => {
      this.log.info('Interval called');
      for (let i = 0; i < this.loadSwitches; i++) {
        const device = this.bridgedDevices.get('Switch' + i);
        const state = device?.getAttribute(OnOffCluster.id, 'onOff');
        await device?.setAttribute(OnOffCluster.id, 'onOff', !state, device?.log);
      }
      for (let i = 0; i < this.loadOutlets; i++) {
        const device = this.bridgedDevices.get('Outlet' + i);
        const state = device?.getAttribute(OnOffCluster.id, 'onOff');
        await device?.setAttribute(OnOffCluster.id, 'onOff', !state, device?.log);
      }
      for (let i = 0; i < this.loadLights; i++) {
        const device = this.bridgedDevices.get('Light' + i);
        const state = device?.getAttribute(OnOffCluster.id, 'onOff');
        await device?.setAttribute(OnOffCluster.id, 'onOff', !state, device?.log);
      }
    }, this.setUpdateInterval * 1000);
  }

  override async onShutdown(reason?: string): Promise<void> {
    this.log.info('onShutdown called with reason:', reason ?? 'none');
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
    if (this.throwShutdown) throw new Error('Throwing error in shutdown');
  }
}

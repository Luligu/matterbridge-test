import {
  Matterbridge,
  MatterbridgeDevice,
  MatterbridgeDynamicPlatform,
  PlatformConfig,
  bridgedNode,
  electricalSensor,
  ElectricalPowerMeasurement,
  ElectricalEnergyMeasurement,
  onOffSwitch,
  onOffLight,
  onOffOutlet,
  ElectricalPowerMeasurementCluster,
  ElectricalEnergyMeasurementCluster,
  PowerSource,
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
  private throwLoad = false;
  private throwStart = false;
  private throwConfigure = false;
  private throwShutdown = false;
  private enableElectrical = false;
  private enableModeSelect = false;
  private enablePowerSource = false;

  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    super(matterbridge, log, config);

    // Verify that Matterbridge is the correct version
    if (this.verifyMatterbridgeVersion === undefined || typeof this.verifyMatterbridgeVersion !== 'function' || !this.verifyMatterbridgeVersion('1.6.0')) {
      throw new Error(`This plugin requires Matterbridge version >= "1.6.0". Please update Matterbridge to the latest version in the frontend.`);
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
      const switchDevice = new MatterbridgeDevice([onOffSwitch, bridgedNode], undefined, this.config.debug as boolean);
      switchDevice.createDefaultBridgedDeviceBasicInformationClusterServer('Switch ' + i, 'serial_switch_' + i, 0xfff1, 'Test plugin', 'Matterbridge');
      switchDevice.addDeviceTypeWithClusterServer([onOffSwitch], []);
      if (this.enableElectrical) this.addElectricalMeasurements(switchDevice);
      if (this.enablePowerSource) this.addPowerSource(switchDevice);
      if (this.enableModeSelect) this.addModeSelect(switchDevice, 'Switch ' + i);
      if (!this.noDevices) await this.registerDevice(switchDevice);
    }

    for (let i = 0; i < this.loadOutlets; i++) {
      const outletDevice = new MatterbridgeDevice([onOffOutlet, bridgedNode], undefined, this.config.debug as boolean);
      outletDevice.createDefaultBridgedDeviceBasicInformationClusterServer('Outlet ' + i, 'serial_outlet_' + i, 0xfff1, 'Test plugin', 'Matterbridge');
      outletDevice.addDeviceTypeWithClusterServer([onOffOutlet], []);
      if (this.enableElectrical) this.addElectricalMeasurements(outletDevice);
      if (this.enablePowerSource) this.addPowerSource(outletDevice);
      if (this.enableModeSelect) this.addModeSelect(outletDevice, 'Outlet ' + i);
      if (!this.noDevices) await this.registerDevice(outletDevice);
    }

    for (let i = 0; i < this.loadLights; i++) {
      const lightDevice = new MatterbridgeDevice([onOffLight, bridgedNode], undefined, this.config.debug as boolean);
      lightDevice.createDefaultBridgedDeviceBasicInformationClusterServer('Light ' + i, 'serial_light_' + i, 0xfff1, 'Test plugin', 'Matterbridge');
      lightDevice.addDeviceTypeWithClusterServer([onOffLight], []);
      if (this.enableElectrical) this.addElectricalMeasurements(lightDevice);
      if (this.enablePowerSource) this.addPowerSource(lightDevice);
      if (this.enableModeSelect) this.addModeSelect(lightDevice, 'Light ' + i);
      if (!this.noDevices) await this.registerDevice(lightDevice);
    }

    /*
    const electrical = new MatterbridgeDevice([electricalSensor, bridgedNode], undefined, this.config.debug as boolean);
    electrical.createDefaultBridgedDeviceBasicInformationClusterServer('Electrical sensor', 'serial_98745631226', 0xfff1, 'Test plugin', 'electricalSensor', 2, '2.1.1');
    electrical.addDeviceTypeWithClusterServer([electricalSensor], [ElectricalPowerMeasurement.Cluster.id, ElectricalEnergyMeasurement.Cluster.id]);
    electrical.setAttribute(ElectricalPowerMeasurementCluster.id, 'voltage', 220 * 1000, electrical.log);
    electrical.setAttribute(ElectricalPowerMeasurementCluster.id, 'activeCurrent', 2.5 * 1000, electrical.log);
    electrical.setAttribute(ElectricalPowerMeasurementCluster.id, 'activePower', 220 * 2.5 * 1000, electrical.log);
    electrical.setAttribute(ElectricalEnergyMeasurementCluster.id, 'cumulativeEnergyImported', { energy: 1.2 * 1000 }, electrical.log);
    if (!this.noDevices) await this.registerDevice(electrical);
    */

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
  }

  override async onShutdown(reason?: string): Promise<void> {
    this.log.info('onShutdown called with reason:', reason ?? 'none');
    if (this.throwShutdown) throw new Error('Throwing error in shutdown');
  }
}

import {
  Matterbridge,
  MatterbridgeDevice,
  MatterbridgeDynamicPlatform,
  PlatformConfig,
  bridgedNode,
  electricalSensor,
  deviceEnergyManagement,
  ElectricalPowerMeasurement,
  ElectricalEnergyMeasurement,
  DeviceEnergyManagement,
  DeviceEnergyManagementMode,
  onOffSwitch,
  onOffLight,
  onOffOutlet,
  ElectricalPowerMeasurementCluster,
  ElectricalEnergyMeasurementCluster,
  DeviceEnergyManagementModeCluster,
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

  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    super(matterbridge, log, config);

    this.log.info('Initializing platform:', this.config.name);

    if (config.noDevices) this.noDevices = config.noDevices as boolean;
    if (config.delayStart) this.delayStart = config.delayStart as boolean;
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
      if (!this.noDevices) await this.registerDevice(switchDevice);
    }

    for (let i = 0; i < this.loadOutlets; i++) {
      const outletDevice = new MatterbridgeDevice([onOffOutlet, bridgedNode], undefined, this.config.debug as boolean);
      outletDevice.createDefaultBridgedDeviceBasicInformationClusterServer('Outlet ' + i, 'serial_outlet_' + i, 0xfff1, 'Test plugin', 'Matterbridge');
      outletDevice.addDeviceTypeWithClusterServer([onOffOutlet], []);
      if (!this.noDevices) await this.registerDevice(outletDevice);
    }

    for (let i = 0; i < this.loadLights; i++) {
      const lightDevice = new MatterbridgeDevice([onOffLight, bridgedNode], undefined, this.config.debug as boolean);
      lightDevice.createDefaultBridgedDeviceBasicInformationClusterServer('Light ' + i, 'serial_light_' + i, 0xfff1, 'Test plugin', 'Matterbridge');
      lightDevice.addDeviceTypeWithClusterServer([onOffLight], []);
      if (!this.noDevices) await this.registerDevice(lightDevice);
    }

    const electrical = new MatterbridgeDevice([electricalSensor, bridgedNode], undefined, this.config.debug as boolean);
    electrical.createDefaultBridgedDeviceBasicInformationClusterServer('Electrical sensor', 'serial_98745631226', 0xfff1, 'Test plugin', 'electricalSensor', 2, '2.1.1');
    electrical.addDeviceTypeWithClusterServer([electricalSensor], [ElectricalPowerMeasurement.Cluster.id, ElectricalEnergyMeasurement.Cluster.id]);
    electrical.setAttribute(ElectricalPowerMeasurementCluster.id, 'voltage', 220, electrical.log);
    electrical.setAttribute(ElectricalPowerMeasurementCluster.id, 'activeCurrent', 2.5, electrical.log);
    electrical.setAttribute(ElectricalPowerMeasurementCluster.id, 'activePower', 220 * 2.5, electrical.log);
    electrical.setAttribute(ElectricalEnergyMeasurementCluster.id, 'cumulativeEnergyImported', { energy: 1.2 }, electrical.log);
    if (!this.noDevices) await this.registerDevice(electrical);

    const energy = new MatterbridgeDevice([deviceEnergyManagement, bridgedNode], undefined, this.config.debug as boolean);
    energy.createDefaultBridgedDeviceBasicInformationClusterServer('Device Energy Management', 'serial_98745631227', 0xfff1, 'Test plugin', 'deviceEnergyManagement', 2, '2.1.1');
    energy.addDeviceTypeWithClusterServer([deviceEnergyManagement], [DeviceEnergyManagement.Cluster.id, DeviceEnergyManagementMode.Cluster.id]);
    energy.addCommandHandler('changeToMode', async ({ request: { newMode }, attributes: { currentMode } }) => {
      this.log.info('Received changeToMode command with mode:', newMode, 'current mode:', currentMode.getLocal());
      energy.setAttribute(DeviceEnergyManagementModeCluster.id, 'currentMode', newMode, energy.log);
    });
    if (!this.noDevices) await this.registerDevice(energy);
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

import {
  ColorControl,
  DeviceTypes,
  LevelControl,
  Matterbridge,
  MatterbridgeDevice,
  MatterbridgeDynamicPlatform,
  OnOff,
  PlatformConfig,
  PowerSource,
  bridgedNode,
  electricalSensor,
  powerSource,
  rainSensor,
  smokeCoAlarm,
  waterFreezeDetector,
  waterLeakDetector,
  deviceEnergyManagement,
  FanControlCluster,
  FanControl,
  airQualitySensor,
  TemperatureMeasurement,
  RelativeHumidityMeasurement,
  BooleanState,
  BooleanStateConfiguration,
  ElectricalPowerMeasurement,
  ElectricalEnergyMeasurement,
  CarbonMonoxideConcentrationMeasurement,
  CarbonDioxideConcentrationMeasurement,
  NitrogenDioxideConcentrationMeasurement,
  OzoneConcentrationMeasurement,
  FormaldehydeConcentrationMeasurement,
  Pm1ConcentrationMeasurement,
  Pm25ConcentrationMeasurement,
  Pm10ConcentrationMeasurement,
  RadonConcentrationMeasurement,
  TotalVolatileOrganicCompoundsConcentrationMeasurement,
  AirQuality,
} from 'matterbridge';

import { waiter } from 'matterbridge/utils';

import { AnsiLogger } from 'matterbridge/logger';

export class TestPlatform extends MatterbridgeDynamicPlatform {
  // Config
  private noDevices = false;
  private delayStart = false;
  private throwLoad = false;
  private throwStart = false;
  private throwConfigure = false;
  private throwShutdown = false;

  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    super(matterbridge, log, config);

    this.log.info('Initializing platform:', this.config.name);

    if (config.noDevices) this.noDevices = config.noDevices as boolean;
    if (config.delayStart) this.delayStart = config.delayStart as boolean;
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

    // Create a new Matterbridge device
    const mbDevice = new MatterbridgeDevice(bridgedNode, undefined, this.config.debug as boolean);
    mbDevice.createDefaultBridgedDeviceBasicInformationClusterServer('Color Temperature Light', 'serial_9874563121', 0xfff1, 'Test plugin', 'colorTemperatureLight', 2, '2.1.1');
    mbDevice.addDeviceType(powerSource);
    mbDevice.createDefaultPowerSourceWiredClusterServer(PowerSource.WiredCurrentType.Ac);
    // mbDevice.createDefaultModeSelectClusterServer();
    const child = mbDevice.addChildDeviceTypeWithClusterServer('PowerSource', [powerSource], [PowerSource.Cluster.id]);
    child.addClusterServer(mbDevice.getDefaultPowerSourceWiredClusterServer());
    mbDevice.addChildDeviceTypeWithClusterServer('Dimmer', [DeviceTypes.COLOR_TEMPERATURE_LIGHT], [OnOff.Cluster.id, LevelControl.Cluster.id, ColorControl.Cluster.id]);
    mbDevice.addFixedLabel('composed', 'Dimmer');
    if (!this.noDevices) await this.registerDevice(mbDevice);

    const airQuality = new MatterbridgeDevice(bridgedNode, undefined, this.config.debug as boolean);
    airQuality.createDefaultBridgedDeviceBasicInformationClusterServer('Air Quality sensor', 'serial_98748431222', 0xfff1, 'Test plugin', 'airQualitySensor', 2, '2.1.1');
    airQuality.addDeviceTypeWithClusterServer(
      [airQualitySensor],
      [
        TemperatureMeasurement.Cluster.id,
        RelativeHumidityMeasurement.Cluster.id,
        CarbonMonoxideConcentrationMeasurement.Cluster.id,
        CarbonDioxideConcentrationMeasurement.Cluster.id,
        NitrogenDioxideConcentrationMeasurement.Cluster.id,
        OzoneConcentrationMeasurement.Cluster.id,
        FormaldehydeConcentrationMeasurement.Cluster.id,
        Pm1ConcentrationMeasurement.Cluster.id,
        Pm25ConcentrationMeasurement.Cluster.id,
        Pm10ConcentrationMeasurement.Cluster.id,
        RadonConcentrationMeasurement.Cluster.id,
        TotalVolatileOrganicCompoundsConcentrationMeasurement.Cluster.id,
      ],
    );
    airQuality.getClusterServerById(AirQuality.Cluster.id)?.setAirQualityAttribute(AirQuality.AirQualityEnum.Good);
    airQuality.getClusterServerById(TemperatureMeasurement.Cluster.id)?.setMeasuredValueAttribute(2150);
    airQuality.getClusterServerById(RelativeHumidityMeasurement.Cluster.id)?.setMeasuredValueAttribute(5500);
    if (!this.noDevices) await this.registerDevice(airQuality);

    const waterLeak = new MatterbridgeDevice(bridgedNode, undefined, this.config.debug as boolean);
    waterLeak.createDefaultBridgedDeviceBasicInformationClusterServer('Water leak detector', 'serial_98745631222', 0xfff1, 'Test plugin', 'waterLeakDetector', 2, '2.1.1');
    waterLeak.addDeviceTypeWithClusterServer([waterLeakDetector], [BooleanStateConfiguration.Cluster.id]);
    waterLeak.getClusterServerById(BooleanState.Cluster.id)?.setStateValueAttribute(false);
    if (!this.noDevices) await this.registerDevice(waterLeak);

    const waterFreeze = new MatterbridgeDevice(bridgedNode, undefined, this.config.debug as boolean);
    waterFreeze.createDefaultBridgedDeviceBasicInformationClusterServer('Water freeze detector', 'serial_98745631223', 0xfff1, 'Test plugin', 'waterFreezeDetector', 2, '2.1.1');
    waterFreeze.addDeviceTypeWithClusterServer([waterFreezeDetector], [BooleanStateConfiguration.Cluster.id]);
    waterFreeze.getClusterServerById(BooleanState.Cluster.id)?.setStateValueAttribute(false);
    if (!this.noDevices) await this.registerDevice(waterFreeze);

    const rain = new MatterbridgeDevice(bridgedNode, undefined, this.config.debug as boolean);
    rain.createDefaultBridgedDeviceBasicInformationClusterServer('Rain sensor', 'serial_98745631224', 0xfff1, 'Test plugin', 'rainSensor', 2, '2.1.1');
    rain.addDeviceTypeWithClusterServer([rainSensor], [BooleanStateConfiguration.Cluster.id]);
    rain.getClusterServerById(BooleanState.Cluster.id)?.setStateValueAttribute(false);
    if (!this.noDevices) await this.registerDevice(rain);

    const smoke = new MatterbridgeDevice(bridgedNode, undefined, this.config.debug as boolean);
    smoke.createDefaultBridgedDeviceBasicInformationClusterServer('Smoke alarm sensor', 'serial_98745631225', 0xfff1, 'Test plugin', 'smokeCoAlarm', 2, '2.1.1');
    smoke.addDeviceTypeWithClusterServer([smokeCoAlarm], [CarbonMonoxideConcentrationMeasurement.Cluster.id]);
    if (!this.noDevices) await this.registerDevice(smoke);

    const electrical = new MatterbridgeDevice(bridgedNode, undefined, this.config.debug as boolean);
    electrical.createDefaultBridgedDeviceBasicInformationClusterServer('Electrical sensor', 'serial_98745631226', 0xfff1, 'Test plugin', 'electricalSensor', 2, '2.1.1');
    electrical.addDeviceTypeWithClusterServer([electricalSensor], [ElectricalPowerMeasurement.Cluster.id, ElectricalEnergyMeasurement.Cluster.id]);
    if (!this.noDevices) await this.registerDevice(electrical);

    const energy = new MatterbridgeDevice(bridgedNode, undefined, this.config.debug as boolean);
    energy.createDefaultBridgedDeviceBasicInformationClusterServer('Device Energy Management', 'serial_98745631227', 0xfff1, 'Test plugin', 'deviceEnergyManagement', 2, '2.1.1');
    energy.addDeviceTypeWithClusterServer([deviceEnergyManagement], []);
    if (!this.noDevices) await this.registerDevice(energy);

    const fan = new MatterbridgeDevice(bridgedNode, undefined, this.config.debug as boolean);
    fan.createDefaultBridgedDeviceBasicInformationClusterServer('Fan', 'serial_98745631228', 0xfff1, 'Test plugin', 'Test fan device', 2, '2.1.1');
    fan.addDeviceTypeWithClusterServer([DeviceTypes.FAN], []);
    if (!this.noDevices) await this.registerDevice(fan);
    const fcc = fan.getClusterServer(FanControlCluster.with(FanControl.Feature.MultiSpeed, FanControl.Feature.Auto));
    if (fcc) {
      const fanModeLookup = ['Off', 'Low', 'Medium', 'High', 'On', 'Auto', 'Smart'];
      fcc.subscribeFanModeAttribute((newValue: FanControl.FanMode, oldValue: FanControl.FanMode) => {
        this.log.info(`Fan mode changed from ${fanModeLookup[oldValue]} to ${fanModeLookup[newValue]}`);
      });
      fcc.subscribePercentSettingAttribute((newValue: number | null, oldValue: number | null) => {
        this.log.info(`Percent setting changed from ${oldValue} to ${newValue}`);
      });
      fcc.subscribePercentCurrentAttribute((newValue: number | null, oldValue: number | null) => {
        this.log.info(`Percent current changed from ${oldValue} to ${newValue}`);
      });
      fcc.subscribeSpeedSettingAttribute((newValue: number | null, oldValue: number | null) => {
        this.log.info(`Speed setting changed from ${oldValue} to ${newValue}`);
      });
      fcc.subscribeSpeedCurrentAttribute((newValue: number | null, oldValue: number | null) => {
        this.log.info(`Speed current changed from ${oldValue} to ${newValue}`);
      });
    }
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

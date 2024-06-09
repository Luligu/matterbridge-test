import { Matterbridge, MatterbridgeDevice, MatterbridgeDynamicPlatform, PlatformConfig, PowerSource, bridgedNode, powerSource, waiter } from 'matterbridge';
import { AnsiLogger } from 'node-ansi-logger';

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

    // Create a new Matterbridge device
    const mbDevice = new MatterbridgeDevice(bridgedNode);
    mbDevice.createDefaultBridgedDeviceBasicInformationClusterServer('First device', 'serial_9874563121', 0xfff1, 'Test plugin', 'Test device', 2, '2.1.1');
    mbDevice.addDeviceType(powerSource);
    mbDevice.createDefaultPowerSourceWiredClusterServer(PowerSource.WiredCurrentType.Ac);
    mbDevice.createDefaultModeSelectClusterServer();

    if (!this.noDevices) await this.registerDevice(mbDevice);

    return Promise.resolve();
  }

  override async onConfigure(): Promise<void> {
    this.log.info('onConfigure called');
    if (this.throwConfigure) throw new Error('Throwing error in configure');
    return Promise.resolve();
  }

  override async onShutdown(reason?: string): Promise<void> {
    this.log.info('onShutdown called with reason:', reason ?? 'none');
    if (this.throwShutdown) throw new Error('Throwing error in shutdown');
    return Promise.resolve();
  }
}

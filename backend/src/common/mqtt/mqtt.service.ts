import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { LoggerService } from '../logger/logger.service';
import { MQTT_CLIENT } from './mqtt.constants';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new LoggerService(MqttService.name);

  constructor(
    @Inject(MQTT_CLIENT) private readonly client: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const config = this.configService.get('mqtt');
    if (!config?.enabled) {
      this.logger.log('MQTT is disabled');
      return;
    }
    try {
      await this.client.connect();
      this.logger.log(`MQTT client connected (publisher)`);
    } catch (err) {
      this.logger.error('MQTT client connect failed', err);
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.close();
    } catch {
      // ignore
    }
  }

  /**
   * Publish to MQTT topic. Topic = pattern for NestJS MQTT.
   * Uses emit (fire-and-forget) - no response expected.
   */
  publish(topic: string, payload: string | object): boolean {
    const config = this.configService.get('mqtt');
    if (!config?.enabled) return false;

    const data = typeof payload === 'object' ? payload : { message: payload };
    try {
      this.client.emit(topic, data);
      return true;
    } catch (err) {
      this.logger.error(`MQTT publish error for ${topic}`, err);
      return false;
    }
  }
}

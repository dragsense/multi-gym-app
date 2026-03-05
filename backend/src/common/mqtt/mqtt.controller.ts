import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, Transport } from '@nestjs/microservices';
import { MqttContext } from '@nestjs/microservices';
import { LoggerService } from '../logger/logger.service';

@Controller()
export class MqttController {
  private readonly logger = new LoggerService(MqttController.name);

  /**
   * Handle messages on template/# (all subtopics under template/)
   * Pattern = MQTT topic; Transport.MQTT binds to MQTT microservice only.
   */
  @MessagePattern('template/#', Transport.MQTT)
  handleTemplateMessages(@Payload() data: Buffer, @Ctx() context: MqttContext) {
    const topic = context.getTopic();
    const msg = data?.toString?.() || '';
    try {
      const parsed = JSON.parse(msg);
      this.logger.log(`MQTT [${topic}]: ${JSON.stringify(parsed)}`);
    } catch {
      this.logger.log(`MQTT [${topic}]: ${msg}`);
    }
  }
}

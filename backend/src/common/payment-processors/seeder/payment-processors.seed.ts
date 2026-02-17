import { EPaymentProcessorType } from '@shared/enums/payment-processors.enum';
import { LoggerService } from '@/common/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaymentProcessor } from '../entities/payment-processor.entity';

@Injectable()
export class PaymentProcessorsSeed {
  private readonly logger = new LoggerService(PaymentProcessorsSeed.name);

  constructor(private readonly dataSource: DataSource) {}

  async run(dataSource?: DataSource): Promise<void> {
    const targetDataSource = dataSource || this.dataSource;

    const paymentProcessors = [
      {
        type: EPaymentProcessorType.STRIPE,
        enabled: true,
        description: 'Credit card payments via Stripe (Stripe Elements, Payment Intents)',
      },
      {
        type: EPaymentProcessorType.PAYSAFE,
        enabled: false,
        description: 'Credit card payments via Paysafe (Paysafe.js hosted fields, Payments API)',
      },
      {
        type: EPaymentProcessorType.CASH,
        enabled: true,
        description: 'Cash payments',
      },
    ];

    for (const data of paymentProcessors) {
      try {
        const repo = targetDataSource.getRepository(PaymentProcessor);
        const existing = await repo.findOne({
          where: { type: data.type },
        });

        if (existing) {
          await repo.update(existing.id, {
            enabled: data.enabled,
            description: data.description,
          });
          this.logger.log(
            `Payment processor already exists: ${data.type}, updated`,
          );
        } else {
          await repo.save(repo.create(data));
          this.logger.log(`Created payment processor: ${data.type}`);
        }
      } catch (error) {
        this.logger.error(
          `Error creating payment processor: ${data.type}`,
          error,
        );
      }
    }
  }
}

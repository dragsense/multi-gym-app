import { EPaymentMethodType } from '@shared/enums/payment-methods.enum';
import { LoggerService } from '@/common/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaymentMethod } from '../entities/payment-method.entity';

@Injectable()
export class PaymentMethodsSeed {
  private readonly logger = new LoggerService(PaymentMethodsSeed.name);
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async run(dataSource?: DataSource): Promise<void> {
    const targetDataSource = dataSource || this.dataSource;

    const paymentMethods = [
      {
        type: EPaymentMethodType.STRIPE,
        enabled: true,
        description: 'Credit card payments via Stripe',
      },
      {
        type: EPaymentMethodType.CASH,
        enabled: true,
        description: 'Cash payments',
      },
    ];

    for (const paymentMethodData of paymentMethods) {
      try {
        const repo = targetDataSource.getRepository(PaymentMethod);
        const existing = await repo.findOne({
          where: { type: paymentMethodData.type },
        });

        if (existing) {
          // Keep it idempotent: update key fields if changed
          await repo.update(existing.id, {
            enabled: paymentMethodData.enabled,
            description: paymentMethodData.description,
          });
          this.logger.log(
            `Payment method already exists: ${paymentMethodData.type}, updated`,
          );
        } else {
          await repo.save(repo.create(paymentMethodData));
          this.logger.log(`Created payment method: ${paymentMethodData.type}`);
        }
      } catch (error) {
        this.logger.error(
          `Error creating payment method: ${paymentMethodData.type}`,
          error,
        );
      }
    }
  }
}

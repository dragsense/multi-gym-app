import {
  Entity,
  Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EPaymentProcessorType } from '@shared/enums/payment-processors.enum';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('payment_processors')
export class PaymentProcessor extends GeneralBaseEntity {

  @ApiProperty({ example: 'stripe', description: 'Payment processor type' })
  @Column({
    type: 'enum',
    enum: EPaymentProcessorType,
    unique: true,
  })
  type: EPaymentProcessorType;

  @ApiProperty({ example: true, description: 'Is this payment processor enabled?' })
  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @ApiProperty({ example: 'Stripe payment configuration', description: 'Description or notes' })
  @Column({ type: 'text', nullable: true })
  description?: string;
}

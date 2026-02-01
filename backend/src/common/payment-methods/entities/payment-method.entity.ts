import {
  Entity,  Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EPaymentMethodType } from '@shared/enums/payment-methods.enum';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('payment_methods')
export class PaymentMethod extends GeneralBaseEntity {

  @ApiProperty({ example: 'stripe', description: 'Payment method type' })
  @Column({ 
    type: 'enum', 
    enum: EPaymentMethodType,
    unique: true
  })
  type: EPaymentMethodType;

  @ApiProperty({ example: true, description: 'Is this payment method enabled?' })
  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @ApiProperty({ example: 'Stripe payment configuration', description: 'Description or notes' })
  @Column({ type: 'text', nullable: true })
  description?: string;
}
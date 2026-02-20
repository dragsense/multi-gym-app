import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Card details (brand, last4, expiry) for a payment method. */
export class PaymentCardInfoDto {
  @ApiProperty({ example: 'visa', description: 'Card brand' })
  brand: string;

  @ApiProperty({ example: '4242', description: 'Last 4 digits' })
  last4: string;

  @ApiProperty({ example: 12, description: 'Expiry month (1-12)' })
  exp_month: number;

  @ApiProperty({ example: 2025, description: 'Expiry year' })
  exp_year: number;

  @ApiPropertyOptional({ example: 'credit', description: 'Funding type' })
  funding?: string;
}

/** Billing details for a payment method. */
export class PaymentCardBillingDetailsDto {
  @ApiPropertyOptional({ example: 'John Doe', nullable: true })
  name?: string | null;

  @ApiPropertyOptional({ example: 'john@example.com', nullable: true })
  email?: string | null;
}

/** Single payment card from GET /payment-adapter/cards (Stripe or Paysafe). */
export class PaymentCardDto {
  @ApiProperty({ example: 'pm_xxx', description: 'Payment method id' })
  id: string;

  @ApiPropertyOptional({ type: () => PaymentCardInfoDto })
  card?: PaymentCardInfoDto;

  @ApiPropertyOptional({ type: () => PaymentCardBillingDetailsDto })
  billing_details?: PaymentCardBillingDetailsDto;

  @ApiPropertyOptional({ example: 1234567890, description: 'Unix timestamp' })
  created?: number;
}

/** Response of GET /payment-adapter/cards. */
export class PaymentCardsResponseDto {
  @ApiProperty({ type: [PaymentCardDto], description: 'Customer payment methods' })
  paymentMethods: PaymentCardDto[];

  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'Default payment method id',
  })
  defaultPaymentMethodId: string | null;
}

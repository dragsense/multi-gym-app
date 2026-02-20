import { Module, forwardRef } from '@nestjs/common';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';
import { PaysafePaymentAdapter } from './adapters/paysafe-payment.adapter';
import { PaymentAdapterService } from './payment-adapter.service';
import { BusinessModule } from '../business/business.module';
import { PaymentProcessorsModule } from '@/common/payment-processors/payment-processors.module';
import { StripeModule } from '../stripe/stripe.module';
import { PaysafeModule } from '../paysafe/paysafe.module';
import { UsersModule } from '../users/users.module';
import { PaymentAdapterCardsController } from './controllers/payment-adapter-cards.controller';
import { PaymentAdapterCardsService } from './services/payment-adapter-cards.service';

@Module({
  imports: [
    forwardRef(() => BusinessModule),
    PaymentProcessorsModule,
    StripeModule,
    PaysafeModule,
    UsersModule,
  ],
  controllers: [PaymentAdapterCardsController],
  providers: [
    PaymentAdapterService,
    PaymentAdapterCardsService,
    StripePaymentAdapter,
    PaysafePaymentAdapter,
  ],
  exports: [PaymentAdapterService, PaymentAdapterCardsService],
})
export class PaymentAdapterModule {}

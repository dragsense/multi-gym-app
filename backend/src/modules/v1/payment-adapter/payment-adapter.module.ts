import { Module, forwardRef } from '@nestjs/common';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';
import { PaysafePaymentAdapter } from './adapters/paysafe-payment.adapter';
import { PaymentAdapterService } from './payment-adapter.service';
import { PaysafeService } from './services/paysafe.service';
import { PaysafeController } from './controllers/paysafe.controller';
import { BusinessModule } from '../business/business.module';
import { PaymentProcessorsModule } from '@/common/payment-processors/payment-processors.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    forwardRef(() => BusinessModule),
    PaymentProcessorsModule,
    StripeModule,
  ],
  controllers: [PaysafeController],
  providers: [
    PaysafeService,
    StripePaymentAdapter,
    PaysafePaymentAdapter,
    PaymentAdapterService,
  ],
  exports: [PaymentAdapterService, PaysafeService],
})
export class PaymentAdapterModule {}

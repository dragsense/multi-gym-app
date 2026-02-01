import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeCustomerController } from './controllers/stripe-customer.controller';
import { PaymentMethodsModule } from '@/common/payment-methods/payment-methods.module';
import { StripeBillingService, StripeCustomerService } from './services';
import { StripeCustomer } from './entities/stripe-customer.entity';
import { BaseStripeService } from './services/base-stripe.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StripeCustomer]),
    PaymentMethodsModule,
    UsersModule,
  ],
  controllers: [StripeController, StripeCustomerController],
  providers: [
    StripeService,
    StripeBillingService,
    StripeCustomerService,
    BaseStripeService,
  ],
  exports: [StripeService, StripeBillingService, StripeCustomerService],
})
export class StripeModule {}

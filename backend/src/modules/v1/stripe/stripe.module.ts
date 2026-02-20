import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeCustomerController } from './controllers/stripe-customer.controller';
import { PaymentProcessorsModule } from '@/common/payment-processors/payment-processors.module';
import { StripeBillingService, StripeCustomerService } from './services';
import { StripeCustomer } from './entities/stripe-customer.entity';
import { BaseStripeService } from './services/base-stripe.service';
import { UsersModule } from '../users/users.module';
import { StripeConnectAccount } from './entities/stripe-connect-account.entity';
import { StripeConnectController } from './controllers/stripe-connect.controller';
import { StripeConnectService } from './services/stripe-connect.service';
import { Business } from '../business/entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StripeCustomer, StripeConnectAccount, Business]),
    PaymentProcessorsModule,
    UsersModule,
  ],
  controllers: [StripeController, StripeCustomerController, StripeConnectController],
  providers: [
    StripeService,
    StripeBillingService,
    StripeCustomerService,
    BaseStripeService,
    StripeConnectService,
  ],
  exports: [StripeService, StripeBillingService, StripeCustomerService, BaseStripeService, StripeConnectService],
})
export class StripeModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeConnectController } from './stripe-connect.controller';
import { StripeConnectService } from './stripe-connect.service';
import { StripeConnectAccount } from '../entities/stripe-connect-account.entity';
import { PaymentMethodsModule } from '@/common/payment-methods/payment-methods.module';
import { UsersModule } from '@/modules/v1/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StripeConnectAccount]),
    PaymentMethodsModule,
    UsersModule
  ],
  controllers: [StripeConnectController],
  providers: [StripeConnectService],
  exports: [StripeConnectService]
})
export class StripeConnectModule {}

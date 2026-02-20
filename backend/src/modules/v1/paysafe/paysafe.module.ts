import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentProcessorsModule } from '@/common/payment-processors/payment-processors.module';
import { Business } from '../business/entities/business.entity';
import { UsersModule } from '../users/users.module';
import { PaysafeCustomer } from './entities/paysafe-customer.entity';
import { PaysafeConnectAccount } from './entities/paysafe-connect-account.entity';
import { PaysafeController } from './controllers/paysafe.controller';
import { PaysafeCustomerController } from './controllers/paysafe-customer.controller';
import { PaysafeConnectController } from './controllers/paysafe-connect.controller';
import { PaysafeService } from './services/paysafe.service';
import { PaysafeCustomerService } from './services/paysafe-customer.service';
import { PaysafeConnectService } from './services/paysafe-connect.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaysafeCustomer, PaysafeConnectAccount, Business]),
    PaymentProcessorsModule,
    UsersModule,
  ],
  controllers: [
    PaysafeController,
    PaysafeCustomerController,
    PaysafeConnectController,
  ],
  providers: [
    PaysafeService,
    PaysafeCustomerService,
    PaysafeConnectService,
  ],
  exports: [PaysafeService, PaysafeCustomerService, PaysafeConnectService],
})
export class PaysafeModule {}

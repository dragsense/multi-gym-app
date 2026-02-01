import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethod } from './entities/payment-method.entity';
import { CrudModule } from '@/common/crud/crud.module';
import { PaymentMethodsSeed } from './seeder/payment-methods.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentMethod]),
    CrudModule
  ],
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService, PaymentMethodsSeed],
  exports: [PaymentMethodsService, PaymentMethodsSeed],
})
export class PaymentMethodsModule {}
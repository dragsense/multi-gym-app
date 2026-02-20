import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentProcessorsService } from './payment-processors.service';
import { PaymentProcessorsController } from './payment-processors.controller';
import { PaymentProcessor } from './entities/payment-processor.entity';
import { CrudModule } from '@/common/crud/crud.module';
import { PaymentProcessorsSeed } from './seeder/payment-processors.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentProcessor]),
    CrudModule,
  ],
  controllers: [PaymentProcessorsController],
  providers: [PaymentProcessorsService, PaymentProcessorsSeed],
  exports: [PaymentProcessorsService, PaymentProcessorsSeed],
})
export class PaymentProcessorsModule {}

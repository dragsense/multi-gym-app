import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [ProductModule],
  controllers: [StoreController],
})
export class StoreModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common/crud/crud.module';

import { DeviceReader } from './entities/device-reader.entity';
import { DeviceReadersService } from './services/device-readers.service';
import { DeviceReadersController } from './controllers/device-readers.controller';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceReader]),
    CrudModule,
    LocationsModule,
  ],
  controllers: [DeviceReadersController],
  providers: [DeviceReadersService],
  exports: [DeviceReadersService],
})
export class DeviceReadersModule {}


import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common/crud/crud.module';

import { Camera } from './entities/camera.entity';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Camera]),
    CrudModule,
    LocationsModule,
  ],
  controllers: [CamerasController],
  providers: [CamerasService],
  exports: [CamerasService],
})
export class CamerasModule { }

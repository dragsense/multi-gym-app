import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common/crud/crud.module';

import { Door } from './entities/door.entity';
import { DoorsService } from './services/doors.service';
import { DoorsController } from './controllers/doors.controller';
import { CamerasModule } from '../../cameras/cameras.module';
import { DeviceReadersModule } from '../../device-readers/device-readers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Door]),
    CrudModule,
    forwardRef(() => CamerasModule),
    forwardRef(() => DeviceReadersModule),
  ],
  controllers: [DoorsController],
  providers: [DoorsService],
  exports: [DoorsService],
})
export class DoorsModule {}

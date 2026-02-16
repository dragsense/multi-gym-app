import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { CheckinSnapshotsService } from './services/checkin-snapshots.service';
import { CameraSnapshotProcessor } from './processors/camera-snapshot.processor';
import { Checkin } from './entities/checkin.entity';
import { CheckinSnapshot } from './entities/checkin-snapshot.entity';
import { Door } from '../locations/doors/entities/door.entity';
import { CrudModule } from '@/common/crud/crud.module';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../users/profiles/profiles.module';
import { LocationsModule } from '../locations/locations.module';
import { DoorsModule } from '../locations/doors/doors.module';
import { FileUploadModule } from '@/common/file-upload/file-upload.module';
import { DeviceReadersModule } from '../device-readers/device-readers.module';
import { CamerasModule } from '../cameras/cameras.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Checkin, CheckinSnapshot, Door]),
    ConfigModule,
    CrudModule,
    UsersModule,
    ProfilesModule,
    LocationsModule,
    DoorsModule,
    FileUploadModule,
    DeviceReadersModule,
    CamerasModule,
    BullModule.registerQueue({ name: 'camera-snapshot' }),
  ],
  exports: [CheckinsService, CheckinSnapshotsService],
  controllers: [CheckinsController],
  providers: [CheckinsService, CheckinSnapshotsService, CameraSnapshotProcessor],
})
export class CheckinsModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common/crud/crud.module';
import { FileUploadModule } from '@/common/file-upload/file-upload.module';

import { Location } from './entities/location.entity';
import { LocationsService } from './services/locations.service';
import { LocationsController } from './controllers/locations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    CrudModule,
    FileUploadModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}


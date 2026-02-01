import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from './entities/profile.entity';
import { CrudModule } from '@/common/crud/crud.module';
import { FileUploadModule } from '@/common/file-upload/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    CrudModule,
    FileUploadModule
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule { }

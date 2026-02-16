import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common/crud/crud.module';
import { FileUploadModule } from '@/common/file-upload/file-upload.module';

import { BannerImage } from './entities/banner-image.entity';
import { Advertisement } from './entities/advertisement.entity';
import { BannerImagesService } from './services/banner-images.service';
import { AdvertisementsService } from './services/advertisements.service';
import { BannerImagesController } from './controllers/banner-images.controller';
import { AdvertisementsController } from './controllers/advertisements.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BannerImage, Advertisement]),
    CrudModule,
    FileUploadModule,
  ],
  controllers: [BannerImagesController, AdvertisementsController],
  providers: [BannerImagesService, AdvertisementsService],
  exports: [BannerImagesService, AdvertisementsService],
})
export class AdvertisementsModule {}


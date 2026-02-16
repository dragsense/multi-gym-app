import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { CrudModule } from '@/common/crud/crud.module';

@Module({
  imports: [TypeOrmModule.forFeature([Setting]), CrudModule],
  controllers: [],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

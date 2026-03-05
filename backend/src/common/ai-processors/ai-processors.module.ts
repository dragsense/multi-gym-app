import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIProcessorsService } from './ai-processors.service';
import { AIProcessorsController } from './ai-processors.controller';
import { AIProcessor } from './entities/ai-processor.entity';
import { CrudModule } from '@/common/crud/crud.module';
import { AIProcessorsSeed } from './seeder/ai-processors.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIProcessor]),
    CrudModule,
  ],
  controllers: [AIProcessorsController],
  providers: [AIProcessorsService, AIProcessorsSeed],
  exports: [AIProcessorsService, AIProcessorsSeed],
})
export class AIProcessorsModule {}

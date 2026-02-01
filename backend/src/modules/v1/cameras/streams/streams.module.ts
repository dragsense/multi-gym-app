import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { StreamsService } from './streams.service';
import { StreamsController } from './streams.controller';
import { CamerasModule } from '../cameras.module';
import { FfmpegProcessor } from './ffmpeg.processor';
import { SrsApiService } from './srs-api.service';
import { StreamCheckProcessor } from './stream-check.processor';

@Module({
  imports: [
    ConfigModule,
    CamerasModule,
    BullModule.registerQueue({ name: 'stream-check' }),
    BullModule.registerQueue({ name: 'ffmpeg-stream' }),
  ],
  controllers: [StreamsController],
  providers: [
    StreamsService,
    FfmpegProcessor,
    SrsApiService,
    StreamCheckProcessor,
  ],
  exports: [StreamsService, FfmpegProcessor],
})
export class StreamsModule { }

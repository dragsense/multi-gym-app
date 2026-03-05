import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StreamsService } from './streams.service';
import { StreamsController } from './streams.controller';
import { CamerasModule } from '../cameras.module';
import { MediaMtxApiService } from './services/mediamtx-api.service';

@Module({
  imports: [ConfigModule, forwardRef(() => CamerasModule)],
  controllers: [StreamsController],
  providers: [StreamsService, MediaMtxApiService],
  exports: [StreamsService],
})
export class StreamsModule {}

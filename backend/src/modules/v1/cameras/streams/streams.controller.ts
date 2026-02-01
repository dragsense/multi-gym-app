import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  private readonly logger = new Logger(StreamsController.name);

  constructor(
    private readonly streamService: StreamsService,
  ) {}

  /**
   * Get stream URLs (does not start stream)
   */
  @Get(':cameraId')
  getStream(@Param('cameraId') cameraId: string) {
    return this.streamService.getStream(cameraId);
  }

  /**
   * Start stream - starts FFmpeg, adds check job, returns URLs
   */
  @Post(':cameraId/start')
  startStream(@Param('cameraId') cameraId: string) {
    return this.streamService.startStream(cameraId);
  }
}

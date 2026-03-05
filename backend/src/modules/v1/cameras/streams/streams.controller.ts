import { Controller, Get, Param } from '@nestjs/common';
import { StreamsService } from './streams.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('Streams')
@Controller('streams')
export class StreamsController {
  constructor(private readonly streamService: StreamsService) {}

  /**
   * Get stream URLs for a camera (HLS + WebRTC). Ensures MediaMTx path exists.
   */
  @Get(':cameraId')
  @ApiOperation({ summary: 'Get stream URLs for a camera' })
  getStream(@Param('cameraId') cameraId: string) {
    return this.streamService.getStream(cameraId);
  }
}

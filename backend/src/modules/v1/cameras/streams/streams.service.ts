import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CamerasService } from '../cameras.service';
import { MediaMtxApiService } from './services/mediamtx-api.service';

@Injectable()
export class StreamsService {
  private readonly logger = new Logger(StreamsService.name);

  constructor(
    private camerasService: CamerasService,
    private configService: ConfigService,
    private mediamtxApi: MediaMtxApiService,
  ) {}

  /**
   * Get stream URLs for a camera. Ensures MediaMTx path exists (RTSP source) and returns HLS/WebRTC URLs.
   * Scales to thousands of cameras; no FFmpeg/SRS/OME.
   */
  async getStream(cameraId: string) {
    const cam = await this.camerasService.getSingle(cameraId);
    if (!cam) throw new NotFoundException('Camera not found');

    const streamUrl = cam.streamUrl;
    if (!streamUrl) {
      throw new NotFoundException('Camera stream URL not configured');
    }

    if(!cam.isActive) {
      throw new NotFoundException('Camera stream is not active');
    }

    const cfg = this.configService.get('mediamtx');
    if (!cfg) throw new NotFoundException('MediaMTx config not found');

    // Path name = cameraId (safe for URL)
    const pathName = cameraId;
    await this.mediamtxApi.ensurePath(pathName, streamUrl);

    return {
      cameraId,
      hlsUrl: cfg.getHlsUrl(pathName),
      webrtcUrl: cfg.getWebrtcUrl(pathName),
    };
  }
}

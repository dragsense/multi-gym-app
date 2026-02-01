import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CamerasService } from '../cameras.service';
import { getStreamKey } from './stream-utils';
import { RequestContext } from '@/common/context/request-context';
import { FfmpegProcessor } from './ffmpeg.processor';

@Injectable()
export class StreamsService {
  private readonly logger = new Logger(StreamsService.name);

  constructor(
    private camerasService: CamerasService,
    private configService: ConfigService,
    private ffmpegProcessor: FfmpegProcessor,
    @InjectQueue('stream-check') private streamCheckQueue: Queue,
    @InjectQueue('ffmpeg-stream') private ffmpegQueue: Queue,
  ) { }

  /**
   * Get stream URLs for a camera (does not start stream)
   */
  async getStream(cameraId: string) {
    const cam = await this.camerasService.getSingle(cameraId);
    if (!cam) throw new NotFoundException('Camera not found');

    const streamKey = getStreamKey(cameraId);
    const srsConfig = this.configService.get('srs');

    if (!srsConfig) {
      return {
        flvUrl: `http://localhost:8080/live/${streamKey}.flv`,
        hlsUrl: `http://localhost:8080/live/${streamKey}.m3u8`,
        whepUrl: `http://localhost:1985/rtc/v1/whep/?app=live&stream=${streamKey}`,
      };
    }

    return {
      flvUrl: srsConfig.getFlvUrl(streamKey),
      hlsUrl: srsConfig.getHlsUrl(streamKey),
      whepUrl: srsConfig.getWhepUrl(streamKey),
    };
  }

  /**
   * Start stream for a camera
   * Starts FFmpeg, adds/updates check job, and returns stream URLs
   */
  async startStream(cameraId: string) {
    const cam = await this.camerasService.getSingle(cameraId);
    if (!cam) throw new NotFoundException('Camera not found');

    const tenantId = RequestContext.get<string>('tenantId');

    const isProcessRunning = this.ffmpegProcessor.isProcessRunning(cameraId);


    // Check if FFmpeg start job already exists, if not add job to start it

    if (!isProcessRunning) {
      const startJobId = `ffmpeg-start-${cameraId}`;
      const existingStartJob = await this.ffmpegQueue.getJob(startJobId);
      if (existingStartJob) {
        try {
          const jobState = await existingStartJob.getState();
          if (jobState !== 'completed' && jobState !== 'failed') {
            await existingStartJob.remove();
          }
        } catch (error) {
          // Job might already be removed or completed - this is fine
          this.logger.debug(`Could not remove existing start job: ${error.message}`);
        }
      }

      this.logger.log(`Adding FFmpeg start job for camera ${cameraId}`);
      await this.ffmpegQueue.add('start', { cameraId, tenantId }, { jobId: startJobId });
    }

    // Remove existing job if any
    const jobName = `check-${cameraId}`;
    const existingJob = await this.streamCheckQueue.getJob(jobName);
    if (!existingJob) {
      await this.streamCheckQueue.add('check', { cameraId }, { jobId: jobName, repeat: { every: 1 * 60 * 1000 } });
    }



  }
}

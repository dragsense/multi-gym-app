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

    if (!srsConfig) throw new NotFoundException('SRS config not found');


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
          await existingStartJob.remove();
        } catch (error) {
          this.logger.debug(`Could not remove existing job: ${error.message}`);
        }
      }

      this.logger.log(`Adding FFmpeg start job for camera ${cameraId}`);
      await this.ffmpegQueue.add('start', { cameraId, tenantId }, { jobId: startJobId });
      // Wait for Bull worker to process job and FFmpeg to connect/publish
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }

    // Add stream check job if not exists
    // Delay first check by 30 seconds to allow WebRTC clients time to connect
    const jobName = `check-${cameraId}`;
    const existingJob = await this.streamCheckQueue.getJob(jobName);
    if (!existingJob) {
      await this.streamCheckQueue.add('check', { cameraId }, {
        jobId: jobName,
        delay: 30 * 1000, // Wait 30 seconds before first check
        repeat: { every: 2 * 60 * 1000 } // Check every 2 minutes
      });
    }

  }
}


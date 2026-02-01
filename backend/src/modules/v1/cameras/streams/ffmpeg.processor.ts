import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { CamerasService } from '../cameras.service';
import { getStreamKey } from './stream-utils';
import { ECameraProtocol } from '@shared/enums';
import { RequestContext } from '@/common/context/request-context';

@Processor('ffmpeg-stream')
@Injectable()
export class FfmpegProcessor {
  private readonly logger = new Logger(FfmpegProcessor.name);
  private processes: Map<string, ChildProcessWithoutNullStreams> = new Map();

  constructor(
    private configService: ConfigService,
    private camerasService: CamerasService,
    @InjectQueue('ffmpeg-stream') private ffmpegQueue: Queue,
  ) { }

  /**
   * Build optimized FFmpeg command based on protocol
   */
  private buildFfmpegArgs(protocol: ECameraProtocol, inputUrl: string, outputUrl: string): string[] {
    const baseArgs: string[] = [];

    // Protocol-specific input options
    switch (protocol) {
      case ECameraProtocol.RTSP:
        baseArgs.push(
          '-rtsp_transport', 'tcp',  // Use TCP for RTSP (more reliable than UDP)
          '-i', inputUrl,
        );
        break;

      case ECameraProtocol.RTMP:
        baseArgs.push(
          '-i', inputUrl,
        );
        break;

      case ECameraProtocol.SRT:
        baseArgs.push(
          '-i', inputUrl,
        );
        break;

      case ECameraProtocol.HLS:
        baseArgs.push(
          '-i', inputUrl,
          '-allowed_extensions', 'ALL',  // Allow all HLS extensions
          '-http_persistent', '1',  // Keep HTTP connection alive
        );
        break;

      case ECameraProtocol.HTTP_MJPEG:
        baseArgs.push(
          '-f', 'mjpeg',  // MJPEG format
          '-i', inputUrl,
          '-framerate', '30',  // Set framerate for MJPEG
          '-re',  // Read input at native frame rate
        );
        break;

      default:
        // Fallback: try to auto-detect from URL
        if (inputUrl.startsWith('rtsp://')) {
          baseArgs.push('-rtsp_transport', 'tcp', '-i', inputUrl);
        } else {
          baseArgs.push('-i', inputUrl);
        }
    }

    // Common video encoding options (optimized for low latency)
    baseArgs.push('-an');  // Disable audio (IP cams often break here)

    // For MJPEG, we need to decode and re-encode (can't copy)
    if (protocol === ECameraProtocol.HTTP_MJPEG) {
      baseArgs.push(
        '-c:v', 'libx264',  // Re-encode to H.264
        '-preset', 'ultrafast',  // Fastest encoding preset
        '-tune', 'zerolatency',  // Zero latency tuning
        '-g', '30',  // GOP size
        '-f', 'flv',
        '-flvflags', 'no_duration_filesize',
      );
    } else {
      // For other protocols, copy codec (no re-encode, ultra low latency)
      baseArgs.push(
        '-c:v', 'copy',  // Copy video codec (no re-encode, ultra low latency)
        '-f', 'flv',  // FLV format for SRS
        '-flvflags', 'no_duration_filesize',  // Optimize FLV output
      );
    }

    // Output URL
    baseArgs.push(outputUrl);

    return baseArgs;
  }

  @Process('start')
  async startStream(job: Job<{ cameraId: string, tenantId?: string }>): Promise<void> {
    const { cameraId, tenantId } = job.data;
    if (!cameraId) return;

   

    if (!this.processes.has(cameraId)) {

      await RequestContext.run(async () => {
        if (tenantId) {
          RequestContext.set('tenantId', tenantId);
        }

        try {
          // Check if process already exists in cache, remove it first



          const cam = await this.camerasService.getSingle(cameraId);
          if (!cam || !cam.streamUrl) {
            throw new Error(`Camera ${cameraId} not found or stream URL missing`);
          }

          const streamKey = getStreamKey(cameraId);
          const srsConfig = this.configService.get('srs');
          const rtmpUrl = srsConfig.getRtmpUrl(streamKey);

          // Get protocol from camera or detect from URL
          const protocol = cam.protocol || this.detectProtocol(cam.streamUrl);

          this.logger.log(`[FFmpeg] Starting stream for camera ${cameraId} (${protocol}) → ${rtmpUrl}`);

          // Build optimized FFmpeg command based on protocol
          const args = this.buildFfmpegArgs(protocol, cam.streamUrl, rtmpUrl);

          this.logger.debug(`[FFmpeg ${cameraId}] Command: ffmpeg ${args.join(' ')}`);

          const proc = spawn('ffmpeg', args);

          proc.on('error', (err: Error & { code?: string }) => {
            this.logger.error(`[FFmpeg ${cameraId}] spawn error: ${err.message}`);
            this.processes.delete(cameraId);
            if (err.code === 'ENOENT') {
              this.logger.error(`[FFmpeg ${cameraId}] ffmpeg not found. Please ensure ffmpeg is installed in the container.`);
            }
          });

          proc.stderr.on('data', (data) => {
            const msg = data.toString();
            //this.logger.debug(`[FFmpeg ${cameraId}] ${msg}`);

            if (msg.includes('Connection refused') || msg.includes('Immediate exit')) {
              this.logger.error(`[FFmpeg ${cameraId}] failed: ${msg.trim()}`);
              proc.kill('SIGINT');
              this.processes.delete(cameraId);
            }
          });

          proc.on('exit', async (code, signal) => {
            this.logger.log(`[FFmpeg ${cameraId}] exited code=${code}, signal=${signal}`);
            this.processes.delete(cameraId);
          });

          proc.on('close', async () => {
            this.logger.log(`[FFmpeg ${cameraId}] stream stopped`);
            this.processes.delete(cameraId);
          });

          // Add process to cache
          this.processes.set(cameraId, proc);
          this.logger.log(`[FFmpeg] Started for camera ${cameraId} → ${rtmpUrl}`);
        } catch (error) {
          this.logger.error(`[FFmpeg] Failed to start stream for camera ${cameraId}: ${error.message}`);
        }

      });
    } 
      // Process already running, remove the job
      await job.remove();
    
  }

  @Process('stop')
  async stopStream(job: Job<{ cameraId: string; tenantId?: string }>): Promise<void> {
    const { cameraId, tenantId } = job.data;
    if (!cameraId) return;

    // Stop process from cache if exists
    if (this.processes.has(cameraId)) {
      const proc = this.processes.get(cameraId);
      if (proc) {
        proc.kill('SIGINT');
        this.processes.delete(cameraId);
        this.logger.log(`[FFmpeg] Stopped process for camera ${cameraId}`);
      }
    }

    // Remove the start job
    const startJobId = `ffmpeg-start-${cameraId}`;
    const startJob = await this.ffmpegQueue.getJob(startJobId);
    if (startJob) {
      try {
        const jobState = await startJob.getState();
        if (jobState !== 'completed' && jobState !== 'failed') {
          await startJob.remove();
          this.logger.log(`[FFmpeg] Removed start job for camera ${cameraId}`);
        }
      } catch (error) {
        this.logger.debug(`[FFmpeg] Could not remove start job ${startJobId}: ${error.message}`);
      }
    }

    // Remove this stop job
    try {
      const jobState = await job.getState();
      if (jobState !== 'completed' && jobState !== 'failed') {
        await job.remove();
      }
    } catch (error) {
      this.logger.debug(`[FFmpeg] Could not remove stop job ${job.id}: ${error.message}`);
    }

  }

  /**
   * Check if process is already running for a camera
   */
  isProcessRunning(cameraId: string): boolean {
    return this.processes.has(cameraId);
  }

  /**
   * Detect protocol from stream URL
   */
  private detectProtocol(streamUrl: string): ECameraProtocol {
    const url = streamUrl.toLowerCase();

    if (url.startsWith('rtsp://')) {
      return ECameraProtocol.RTSP;
    } else if (url.startsWith('rtmp://')) {
      return ECameraProtocol.RTMP;
    } else if (url.startsWith('srt://')) {
      return ECameraProtocol.SRT;
    } else if (url.includes('.m3u8') || url.includes('hls')) {
      return ECameraProtocol.HLS;
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      // Check if it's MJPEG
      if (url.includes('mjpeg') || url.includes('mjpg') || url.includes('jpg')) {
        return ECameraProtocol.HTTP_MJPEG;
      }
      // Default HTTP to HLS if it contains playlist indicators
      return ECameraProtocol.HLS;
    }

    // Default to RTSP
    return ECameraProtocol.RTSP;
  }
}

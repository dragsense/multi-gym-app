import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SrsApiService } from './srs-api.service';
import { getStreamKey } from './stream-utils';

@Processor('stream-check')
@Injectable()
export class StreamCheckProcessor {
  private readonly logger = new Logger(StreamCheckProcessor.name);

  constructor(
    private srsApiService: SrsApiService,
    @InjectQueue('ffmpeg-stream') private ffmpegQueue: Queue,
    @InjectQueue('stream-check') private streamCheckQueue: Queue,
  ) { }

  @Process('check')
  async checkStream(job: Job): Promise<void> {
    const { cameraId } = job.data;
    if (!cameraId) return;

    try {
      const streamKey = getStreamKey(cameraId);
      const viewerCount = await this.srsApiService.getStreamViewerCount(streamKey);

      this.logger.log(`Viewer count for camera ${cameraId}: ${viewerCount}`);

      if (viewerCount <= 1) {

        this.logger.log(`Stopping stream for camera ${cameraId} - no clients`);
        await this.ffmpegQueue.add('stop', { cameraId }, { jobId: `ffmpeg-stop-${cameraId}` });

        // Remove the repeatable check job using the job's key
        if (job.opts?.repeat?.key) {
          await this.streamCheckQueue.removeRepeatableByKey(job.opts.repeat.key);
          this.logger.log(`Removed repeatable check job for camera ${cameraId}`);
        } else {
          // Fallback: find repeatable job by getting all and matching jobId
          const jobName = `check-${cameraId}`;
          try {
            const repeatableJobs = await this.streamCheckQueue.getRepeatableJobs();
            const repeatableJob = repeatableJobs.find(
              (rj) => rj.id === jobName || rj.key?.includes(jobName)
            );
            if (repeatableJob) {
              await this.streamCheckQueue.removeRepeatableByKey(repeatableJob.key);
              this.logger.log(`Removed repeatable check job for camera ${cameraId} (fallback)`);
            }
          } catch (error) {
            this.logger.error(`Failed to remove repeatable job for camera ${cameraId}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error checking stream for camera ${cameraId}: ${error.message}`);
    }
  }
}

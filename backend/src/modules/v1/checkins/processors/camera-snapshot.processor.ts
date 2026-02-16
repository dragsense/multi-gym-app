import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { CamerasService } from '../../cameras/cameras.service';
import { ECameraProtocol } from '@shared/enums';
import { RequestContext } from '@/common/context/request-context';
import { FileUploadService } from '@/common/file-upload/file-upload.service';
import { CheckinSnapshotsService } from '../services/checkin-snapshots.service';

@Processor('camera-snapshot')
@Injectable()
export class CameraSnapshotProcessor {
  private readonly logger = new Logger(CameraSnapshotProcessor.name);

  constructor(
    private configService: ConfigService,
    private camerasService: CamerasService,
    private fileUploadService: FileUploadService,
    private checkinSnapshotsService: CheckinSnapshotsService,
  ) { }

  @Process('capture')
  async captureSnapshots(job: Job<{ checkinId: string; cameraId: string; tenantId?: string }>): Promise<void> {
    const { checkinId, cameraId, tenantId } = job.data;
    if (!checkinId || !cameraId) {
      this.logger.error('Missing checkinId or cameraId in job data');
      return;
    }

    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        // Get camera
        const cam = await this.camerasService.getSingle(cameraId);
        if (!cam || !cam.streamUrl) {
          this.logger.warn(`Camera ${cameraId} not found or stream URL missing`);
          return;
        }

        this.logger.log(`Capturing 3 snapshots for checkin ${checkinId} from camera ${cameraId}`);

        // Capture 3 snapshots with delays between them
        const snapshots: Buffer[] = [];
        const delays = [0, 1000, 2000]; // 0ms, 1s, 2s delays

        for (let i = 0; i < 3; i++) {
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, delays[i] - delays[i - 1]));
          }

          const snapshot = await this.captureSingleSnapshot(cam.streamUrl, cam.protocol);
          if (snapshot) {
            snapshots.push(snapshot);
          }
        }

        if (snapshots.length === 0) {
          this.logger.warn(`No snapshots captured for checkin ${checkinId}`);
          return;
        }

        // Save snapshots and create CheckinSnapshot entities using service
        const filesToSave: Array<{ file: Express.Multer.File; fileUpload: any }> = [];

        for (let i = 0; i < snapshots.length; i++) {
          const sequence = i + 1;
          const imageBuffer = snapshots[i];

          // Create file object
          const fileName = `checkin-${checkinId}-snapshot-${sequence}-${Date.now()}.jpg`;
          const imageFile = {
            buffer: imageBuffer,
            originalname: fileName,
            mimetype: 'image/jpeg',
            size: imageBuffer.length,
          } as Express.Multer.File;

          // Create CheckinSnapshot using service (handles tenant context)
          const checkinSnapshot = await this.checkinSnapshotsService.createCheckinSnapshot(
            checkinId,
            sequence,
            imageFile,
          );

          // Get fileUpload from the created snapshot
          const fileUpload = checkinSnapshot.image;
          if (fileUpload) {
            filesToSave.push({
              file: imageFile,
              fileUpload: fileUpload,
            });
          }

          this.logger.log(`Created snapshot ${sequence} entity for checkin ${checkinId}`);
        }

        // Save all files to disk
        if (filesToSave.length > 0) {
          await this.fileUploadService.saveFiles(filesToSave);
          this.logger.log(`Saved ${filesToSave.length} snapshot files to disk for checkin ${checkinId}`);
        }

        this.logger.log(`Successfully captured and saved ${snapshots.length} snapshots for checkin ${checkinId}`);
      } catch (error) {
        this.logger.error(`Error capturing snapshots for checkin ${checkinId}: ${error.message}`, error.stack);
      } finally {
        try {
          await job.remove();
        } catch (error) {
          this.logger.debug(`Could not remove job ${job.id}: ${error.message}`);
        }
      }
    });
  }

  /**
   * Capture a single snapshot from camera stream using FFmpeg
   */
  private async captureSingleSnapshot(streamUrl: string, protocol?: ECameraProtocol): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      const tempFile = path.join(process.cwd(), 'tmp', `snapshot-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);

      // Ensure tmp directory exists
      const tmpDir = path.dirname(tempFile);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const args: string[] = [];

      // Protocol-specific input options
      if (protocol === ECameraProtocol.RTSP) {
        args.push('-rtsp_transport', 'tcp', '-i', streamUrl);
      } else if (protocol === ECameraProtocol.HTTP_MJPEG) {
        args.push('-f', 'mjpeg', '-i', streamUrl);
      } else {
        args.push('-i', streamUrl);
      }

      // Capture single frame
      args.push(
        '-vframes', '1',           // Capture only 1 frame
        '-q:v', '2',               // High quality JPEG
        '-y',                      // Overwrite output file
        tempFile
      );

      const ffmpeg = spawn('ffmpeg', args);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('error', (err: Error & { code?: string }) => {
        if (err.code === 'ENOENT') {
          this.logger.error('ffmpeg not found. Please ensure ffmpeg is installed.');
        }
        // Clean up temp file if it exists
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
        reject(err);
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`FFmpeg snapshot capture failed with code ${code}: ${errorOutput}`);
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
          resolve(null);
          return;
        }

        // Read the captured image
        if (fs.existsSync(tempFile)) {
          try {
            const imageBuffer = fs.readFileSync(tempFile);
            // Clean up temp file
            fs.unlinkSync(tempFile);
            resolve(imageBuffer);
          } catch (error) {
            this.logger.error(`Error reading snapshot file: ${error.message}`);
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
            resolve(null);
          }
        } else {
          this.logger.error('Snapshot file was not created');
          resolve(null);
        }
      });
    });
  }
}

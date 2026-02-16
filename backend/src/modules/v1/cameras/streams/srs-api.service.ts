import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SRSStreamInfo, SRSStreamsResponse } from './interfaces/srs-api.interface';

@Injectable()
export class SrsApiService {
  private readonly logger = new Logger(SrsApiService.name);
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    const srsConfig = this.configService.get('srs');

    this.apiUrl = `http://${srsConfig.host}:${srsConfig.apiPort}`;
    this.logger.log(`SRS API Service initialized with base URL: ${this.apiUrl}`);
  }

  /**
   * Get stream info by stream key
   */
  async getStreamByKey(streamKey: string): Promise<SRSStreamInfo | null> {
    try {
      // Use SRS API to get specific stream by name
      const response = await fetch(`${this.apiUrl}/api/v1/streams?name=${encodeURIComponent(streamKey)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Stream not found is not an error, just return null
          return null;
        }
        this.logger.error(`SRS API returned status: ${response.status} for stream ${streamKey}`);
        return null;
      }

      const data: SRSStreamsResponse = await response.json();
      
      if (data.code !== 0) {
        this.logger.error(`SRS API returned error code: ${data.code} for stream ${streamKey}`);
        return null;
      }

      // Return the first stream if found, or null
      return data.streams && data.streams.length > 0 ? data.streams[0] : null;
    } catch (error) {
      this.logger.error(`Failed to get stream ${streamKey}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get number of clients (viewers) for a stream
   */
  async getStreamViewerCount(streamKey: string): Promise<number> {
    try {
      const stream = await this.getStreamByKey(streamKey);
      return stream?.clients || 0;
    } catch (error) {
      this.logger.error(`Failed to get viewer count for ${streamKey}: ${error.message}`);
      return 0;
    }
  }
}

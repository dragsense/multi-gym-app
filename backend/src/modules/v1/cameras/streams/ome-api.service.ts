import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OmeApiService {
  private readonly logger = new Logger(OmeApiService.name);
  private readonly apiUrl: string;
  private readonly vhost: string;
  private readonly app: string;
  private readonly apiAccessToken: string;

  constructor(private configService: ConfigService) {
    const omeConfig = this.configService.get('ome');
    this.apiUrl = `http://${omeConfig.host}:${omeConfig.apiPort}`;
    this.vhost = omeConfig.vhost;
    this.app = omeConfig.app;
    this.apiAccessToken = omeConfig.apiAccessToken;
    this.logger.log(`OME API Service initialized with base URL: ${this.apiUrl}`);
  }

  /**
   * Get Authorization header value for OME API requests
   * OME requires: "Basic base64encode(<AccessToken>)"
   */
  private getAuthHeader(): string {
    const token = Buffer.from(this.apiAccessToken).toString('base64');
    return `Basic ${token}`;
  }

 
  async createStream(streamKey: string, urls: string[]): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiUrl}/v1/vhosts/${this.vhost}/apps/${this.app}/streams`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.getAuthHeader(),
          },
          body: JSON.stringify({
            name: streamKey,
            urls: urls,
            properties: {
              persistent: false,
              // 3s is often too aggressive for RTSP handshakes across LAN/Docker/NAT.
              // OME logs show 3000ms connect timeouts; give the camera more time.
              noInputFailoverTimeoutMs: 10000,
              unusedStreamDeletionTimeoutMs: 300000, // 5 minutes - give more time before auto-delete
              ignoreRtcpSRTimestamp: false
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        // 409 = Stream already exists - this is fine, just return success
        if (response.status === 409) {
          this.logger.log(`Stream already exists: ${streamKey}, getting stream info...`);
          // Try to get the existing stream info
        
          // If we can't get it, that's okay - stream exists
          return;
        }
        this.logger.error(`OME API returned status: ${response.status} - ${errorText}`);
        throw new Error(`OME API returned status: ${response.status} - ${errorText}`);
        }

      this.logger.log(`Stream created: ${streamKey} from ${urls}`);
     
    } catch (error: any) {
      this.logger.error(`Failed to create stream ${streamKey}: ${error.message}`);
      throw error;
    }
  }

  async getStream(streamKey: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.apiUrl}/v1/vhosts/${this.vhost}/apps/${this.app}/streams/${streamKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.getAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OME RTSP Pull API returned status: ${response.status} - ${errorText}`);
        return null;
      }

      const data: any = await response.json();
      return data;
    } catch (error: any) {
      this.logger.error(`Failed to get stream ${streamKey}: ${error.message}`);
      return null;
    }
  }

  /**
   * Stop/Delete RTSP Pull stream
   * OME API: DELETE /v1/vhosts/{vhost}/apps/{app}/streams/{streamName}
   */
  async deleteStream(streamKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiUrl}/v1/vhosts/${this.vhost}/apps/${this.app}/streams/${streamKey}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': this.getAuthHeader(),
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok && response.status !== 404) {
        this.logger.error(`OME API returned status: ${response.status} when deleting stream ${streamKey}`);
        return false;
      }

      this.logger.log(`Stream deleted: ${streamKey}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to delete stream ${streamKey}: ${error.message}`);
      return false;
    }
  }
}

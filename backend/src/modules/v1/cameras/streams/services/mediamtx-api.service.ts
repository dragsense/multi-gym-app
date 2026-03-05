import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaMtxApiService {
  private readonly logger = new Logger(MediaMtxApiService.name);
  private apiBase: string;
  private apiUser: string;
  private apiPass: string;

  constructor(private configService: ConfigService) {
    const cfg = this.configService.get('mediamtx');
    this.apiBase = cfg?.apiBase ?? 'http://mediamtx:9997';
    this.apiUser = cfg?.apiUser ?? 'admin';
    this.apiPass = cfg?.apiPass ?? 'admin123';
    this.logger.log(`MediaMTx API base: ${this.apiBase}`);
  }

  private async request<T>(method: string, path: string, body?: object): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiUser && this.apiPass) {
      headers['Authorization'] = `Basic ${Buffer.from(`${this.apiUser}:${this.apiPass}`).toString('base64')}`;
    }
    let res: Response;
    try {
      res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`MediaMTx API unreachable: ${url} - ${msg}`);
      throw new Error(
        `MediaMTx unreachable at ${url}. Check MEDIAMTX_HOST (use "mediamtx" in Docker) and that MediaMTx is running. ${msg}`,
      );
    }
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`MediaMTx API ${method} ${path} ${res.status}: ${text}`);
      throw new Error(`MediaMTx API ${res.status}: ${text}`);
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T;
    return res.json() as Promise<T>;
  }

  async ensurePath(pathName: string, rtspSourceUrl: string): Promise<void> {
    const safeName = encodeURIComponent(pathName);
    const body = { source: rtspSourceUrl };
    try {
      await this.request('POST', `/v3/config/paths/add/${safeName}`, body);
      this.logger.debug(`MediaMTx path added: ${pathName}`);
    } catch {
      await this.request('PATCH', `/v3/config/paths/patch/${safeName}`, body);
      this.logger.debug(`MediaMTx path patched: ${pathName}`);
    }
  }
}

import { registerAs } from '@nestjs/config';

export default registerAs('mediamtx', () => {
  const host = process.env.MEDIAMTX_HOST || 'mediamtx';
  const apiPort = parseInt(process.env.MEDIAMTX_API_PORT ?? '9997', 10);
  const hlsPort = parseInt(process.env.MEDIAMTX_HLS_PORT ?? '8888', 10);
  const webrtcPort = parseInt(process.env.MEDIAMTX_WEBRTC_PORT ?? '8889', 10);
  // Must match MediaMTx authInternalUsers (permission "api") when API is not on localhost
  const apiUser = process.env.MEDIAMTX_API_USER ?? 'admin';
  const apiPass = process.env.MEDIAMTX_API_PASS ?? 'admin123';

  // Public base URL for frontend (browser) access
  const publicHost = process.env.MEDIAMTX_PUBLIC_HOST ?? 'localhost';
  const publicHlsPort = parseInt(process.env.MEDIAMTX_PUBLIC_HLS_PORT ?? process.env.MEDIAMTX_HLS_PORT ?? '8888', 10);
  const publicWebrtcPort = parseInt(process.env.MEDIAMTX_PUBLIC_WEBRTC_PORT ?? process.env.MEDIAMTX_WEBRTC_PORT ?? '8889', 10);

  const apiBase = `http://${host}:${apiPort}`;
  const hlsBaseUrl = `http://${publicHost}:${publicHlsPort}`;
  const webrtcBaseUrl = `http://${publicHost}:${publicWebrtcPort}`;

  return {
    host,
    apiPort,
    hlsPort,
    webrtcPort,
    apiBase,
    apiUser,
    apiPass,
    hlsBaseUrl,
    webrtcBaseUrl,
    getHlsUrl(pathName: string): string {
      return `${hlsBaseUrl}/${pathName}/index.m3u8`;
    },
    getWebrtcUrl(pathName: string): string {
      return `${webrtcBaseUrl}/${pathName}/whep`;
    },
  };
});

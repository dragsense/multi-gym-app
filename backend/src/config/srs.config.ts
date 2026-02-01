import { registerAs } from '@nestjs/config';

export default registerAs('srs', () => {
  const host = process.env.SRS_HOST || 'localhost';
  const rtmpPort = parseInt(process.env.SRS_RTMP_PORT ?? '1935', 10);
  const httpPort = parseInt(process.env.SRS_HTTP_PORT ?? '8080', 10);
  const apiPort = parseInt(process.env.SRS_API_PORT ?? '1985', 10);
  const rtcPort = parseInt(process.env.SRS_RTC_PORT ?? '8000', 10);
  const app = process.env.SRS_APP || 'live';
  
  // SRS Public URLs (for frontend access)
  const publicHost = process.env.SRS_PUBLIC_HOST || host;
  const publicHttpPort = parseInt(process.env.SRS_PUBLIC_HTTP_PORT ?? process.env.SRS_HTTP_PORT ?? '8080', 10);
  const publicApiPort = parseInt(process.env.SRS_PUBLIC_API_PORT ?? process.env.SRS_API_PORT ?? '1985', 10);

  return {
    // SRS Server Configuration
    host,
    rtmpPort,
    httpPort,
    apiPort,
    rtcPort,

    // SRS Application and Stream Configuration
    app,
    
    // SRS Public URLs (for frontend access)
    publicHost,
    publicHttpPort,
    publicApiPort,

    // WebRTC Candidate Configuration
    candidate: process.env.SRS_CANDIDATE || '*',

    // Stream URL Helper Functions
    getFlvUrl: (streamKey: string) => `http://${publicHost}:${publicHttpPort}/${app}/${streamKey}.flv`,
    getHlsUrl: (streamKey: string) => `http://${publicHost}:${publicHttpPort}/${app}/${streamKey}.m3u8`,
    getWhepUrl: (streamKey: string) => `http://${publicHost}:${publicApiPort}/rtc/v1/whep/?app=${app}&stream=${streamKey}`,
    getRtmpUrl: (streamKey: string) => `rtmp://${host}:${rtmpPort}/${app}/${streamKey}`,
  };
});

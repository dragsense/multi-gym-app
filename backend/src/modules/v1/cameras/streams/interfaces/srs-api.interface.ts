export interface SRSStreamInfo {
  id: string;
  name: string;
  vhost: string;
  app: string;
  stream: string;
  clients: number;
  frames: number;
  send_bytes: number;
  recv_bytes: number;
  kbps: {
    recv_30s: number;
    send_30s: number;
  };
  publish: {
    active: boolean;
    cid: string;
  };
  video: {
    codec: string;
    profile: string;
    level: string;
    width: number;
    height: number;
  };
  audio: {
    codec: string;
    sample_rate: number;
    channel: number;
  };
}

export interface SRSStreamsResponse {
  code: number;
  server: {
    self: {
      pid: number;
      ppid: number;
      argv: string[];
    };
    time: number;
  };
  streams: SRSStreamInfo[];
}

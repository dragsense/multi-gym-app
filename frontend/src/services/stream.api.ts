import { BaseService } from "./base.service.api";
import type { IStreamResponse } from "@shared/interfaces/stream.interface";

const STREAMS_API_PATH = "/streams";

const streamService = new BaseService<IStreamResponse, never, never>(
  STREAMS_API_PATH
);

/** Get stream URLs for a camera (MediaMTx HLS + WebRTC). Ensures path exists. */
export const getCameraStream = (cameraId: string) =>
  streamService.getSingle<IStreamResponse>(undefined, undefined, `/${cameraId}`);

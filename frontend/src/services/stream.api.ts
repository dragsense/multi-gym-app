import { BaseService } from "./base.service.api";
import type { IStreamResponse } from "@shared/interfaces/stream.interface";

const STREAMS_API_PATH = "/streams";

const streamService = new BaseService<IStreamResponse, never, never>(
  STREAMS_API_PATH
);

/**
 * Get stream URLs (does not start stream)
 */
export const getCameraStream = (cameraId: string) =>
  streamService.getSingle<IStreamResponse>(undefined, undefined, `/${cameraId}`);

/**
 * Start stream - starts FFmpeg and returns URLs
 */
export const startCameraStream = (cameraId: string) =>
  streamService.post<void>({} as never, undefined, `/${cameraId}/start`);
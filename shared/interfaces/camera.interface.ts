import { IMessageResponse } from './api/response.interface';
import { CameraDto } from '../dtos/camera-dtos';

export interface ICamera extends CameraDto {
  omeStreamUrl?: string; // OvenMediaEngine HLS stream URL for frontend playback
};

export type TCameraResponse = { camera: ICamera } & IMessageResponse;

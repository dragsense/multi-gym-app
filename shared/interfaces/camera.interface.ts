import type { IMessageResponse } from './api/response.interface';
import { CameraDto } from '../dtos/camera-dtos';

export interface ICamera extends CameraDto {
}

export type TCameraResponse = { camera: ICamera } & IMessageResponse;

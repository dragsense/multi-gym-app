// Utils
import { BaseService } from "./base.service.api";

// Types
import type {
  IMessageResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { CreateCameraDto, UpdateCameraDto, CameraDto } from "@shared/dtos";

// Constants
const CAMERAS_API_PATH = "/cameras";

// Create base service instance
const cameraService = new BaseService<
  CameraDto,
  CreateCameraDto,
  UpdateCameraDto
>(CAMERAS_API_PATH);

// Re-export common CRUD operations
export const fetchCameras = (params: IListQueryParams, locationId?: string) => cameraService.get({...params, filters: { ...(params.filters || {}), locationId }});
export const fetchCamera = (id: string, params?: IListQueryParams) => cameraService.getSingle(id, params);
export const deleteCamera = (id: string) => cameraService.delete(id);

// Camera-specific methods
export const createCamera = (data: CreateCameraDto) =>
  cameraService.post(data);

export const updateCamera = (id: string) => (data: UpdateCameraDto) =>
  cameraService.patch(id)(data);

// Update camera status
export const updateCameraStatus = (id: string) => (data: { isActive: boolean }) =>
  cameraService.patch<IMessageResponse & { camera: CameraDto }>(id)(data, undefined, "/status");

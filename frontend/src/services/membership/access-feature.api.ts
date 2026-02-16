// Utils
import { apiRequest } from "@/utils/fetcher";
import { BaseService } from "../base.service.api";

// Types
import type {
  IMessageResponse,
  IPaginatedResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { CreateAccessFeatureDto, UpdateAccessFeatureDto, AccessFeatureDto } from "@shared/dtos";

// Constants
const ACCESS_FEATURES_API_PATH = "/access-features";

// Create base service instance
const accessFeatureService = new BaseService<
  AccessFeatureDto,
  CreateAccessFeatureDto,
  UpdateAccessFeatureDto
>(ACCESS_FEATURES_API_PATH);

// Re-export common CRUD operations
export const fetchAccessFeatures = (params: IListQueryParams) => accessFeatureService.get(params);
export const fetchAccessFeature = (id: string) => accessFeatureService.getSingle(id);
export const deleteAccessFeature = (id: string) => accessFeatureService.delete(id);

// Access feature-specific methods
export const createAccessFeature = (data: CreateAccessFeatureDto) =>
  accessFeatureService.post(data);
export const updateAccessFeature = (id: string) => accessFeatureService.patch(id);


// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IBannerImage, IBannerImageResponse } from "@shared/interfaces/advertisement.interface";
import type { TCreateBannerImageData, TUpdateBannerImageData } from "@shared/types/advertisement.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const BANNER_IMAGE_API_PATH = "/banner-images";

// Create base service instance
const bannerImageService = new BaseService<
  IBannerImage,
  TCreateBannerImageData,
  TUpdateBannerImageData
>(BANNER_IMAGE_API_PATH);

// Re-export common CRUD operations
export const fetchBannerImages = (params: IListQueryParams) =>
  bannerImageService.get<IBannerImage>(params);

export const fetchBannerImage = (id: string, params?: Record<string, any>) =>
  bannerImageService.getSingle<IBannerImage>(id, params);

export const createBannerImage = (data: TCreateBannerImageData) =>
  bannerImageService.postFormData<IBannerImageResponse>(data);

export const updateBannerImage = (id: string) => (data: TUpdateBannerImageData) =>
  bannerImageService.patchFormData<IMessageResponse>(id)(data);

export const deleteBannerImage = (id: string) =>
  bannerImageService.delete(id);


import { BaseService } from "../base.service.api";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { TBusinessData, TCreateBusinessWithUserData, TUpdateBusinessWithUserData } from "@shared/types";
import type { IBusiness, IMessageResponse } from "@shared/interfaces";
import type { BusinessImpersonateResponseDto } from "@shared/dtos";

const BUSINESS_API_PATH = "/business";

// Create base service instance
const businessService = new BaseService<
  IBusiness,
  TBusinessData,
  Partial<TBusinessData>
>(BUSINESS_API_PATH);

// Re-export common CRUD operations
export const fetchBusinesses = (params: IListQueryParams) =>
  businessService.get(params);

export const fetchBusiness = (id: string, params?: IListQueryParams) =>
  businessService.getSingle(id, params);

export const createBusiness = (data: TBusinessData) =>
  businessService.post(data);

export const createBusinessWithUser = (data: TCreateBusinessWithUserData): Promise<IMessageResponse & { business: IBusiness }> =>
  businessService.post<IMessageResponse & { business: IBusiness }>(data, undefined, "/with-user");

export const updateBusiness = (id: string) => businessService.patch(id);

export const updateBusinessWithUser = (id: string) => (data: TUpdateBusinessWithUserData): Promise<IMessageResponse & { business: IBusiness }> =>
  businessService.post<IMessageResponse & { business: IBusiness }>(data, undefined, `/${id}/with-user`);

export const deleteBusiness = (id: string) =>
  businessService.delete(id);

export const getMyBusiness = (): Promise<IBusiness | null> =>
  businessService.getSingle<IBusiness | null>(undefined, undefined, "/me");

export const updateMyBusiness = (data: Partial<TBusinessData>): Promise<IBusiness> =>
  businessService.patch<IBusiness>(undefined)(data, undefined, "/me");

/**
 * Login to current user's business
 * @returns Login response with redirect URL and token
 */
export const loginToMyBusiness = (): Promise<BusinessImpersonateResponseDto> =>
  businessService.post<BusinessImpersonateResponseDto>({} as TBusinessData, undefined, "/login");

/**
 * Login to business as admin (impersonation)
 * @param businessId - The business ID to login to
 * @returns Impersonation response with redirect URL and token
 */
export const loginToBusiness = (businessId: string): Promise<BusinessImpersonateResponseDto> =>
  businessService.post<BusinessImpersonateResponseDto>({} as TBusinessData, undefined, `/${businessId}/login-as`);


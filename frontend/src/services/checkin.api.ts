// Utils
import { apiRequest } from "@/utils/fetcher";
import { BaseService } from "./base.service.api";

// Types
import type {
  IMessageResponse,
  IPaginatedResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { CreateCheckinDto, UpdateCheckinDto, CheckinDto } from "@shared/dtos";

// Constants
const CHECKINS_API_PATH = "/checkins";

// Create base service instance
const checkinService = new BaseService<
  CheckinDto,
  CreateCheckinDto,
  UpdateCheckinDto
>(CHECKINS_API_PATH);

// Re-export common CRUD operations
export const fetchCheckins = (params: IListQueryParams, locationId?: string) => checkinService.get({...params, filters: { ...(params.filters || {}), locationId }});
export const fetchCheckin = (id: string, params: IListQueryParams) => checkinService.getSingle(id, params);
export const deleteCheckin = (id: string) => checkinService.delete(id);

// Checkin-specific methods
export const createCheckin = (data: CreateCheckinDto) =>
  checkinService.post(data);

export const updateCheckin = (id: string) => checkinService.patch(id);

// Checkout checkin
export const checkoutCheckin = (id: string, checkoutTime?: string) =>
  apiRequest<IMessageResponse & { checkin: CheckinDto }>(
    `${CHECKINS_API_PATH}/${id}/checkout`,
    "POST",
    checkoutTime ? { checkOutTime: checkoutTime } : undefined
  );

// Get checkins for a specific user
export const fetchUserCheckins = (
  userId: string,
  params?: IListQueryParams
) => {
  return checkinService.get<CheckinDto>(
    params,
    `/user/${userId}`
  );
};


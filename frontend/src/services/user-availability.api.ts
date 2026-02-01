// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IUserAvailability } from "@shared/interfaces/user-availability.interface";
import type { TQueryParams, TUserAvailabilityData } from "@shared/types";

// Constants
const USER_AVAILABILITY_API_PATH = "/user-availability";

// Create base service instance
const userAvailabilityService = new BaseService<
  IUserAvailability,
  TUserAvailabilityData,
  Partial<TUserAvailabilityData>
>(USER_AVAILABILITY_API_PATH);

// Re-export common CRUD operations
export const fetchUserAvailabilities = (params: IListQueryParams) =>
  userAvailabilityService.get(params);
export const fetchUserAvailability = (id: string, params: IListQueryParams) =>
  userAvailabilityService.getSingle(id, params);
export const createUserAvailability = (data: TUserAvailabilityData) =>
  userAvailabilityService.post(data);
export const updateUserAvailability = (id: string) =>
  userAvailabilityService.patch(id);
export const deleteUserAvailability = (id: string) =>
  userAvailabilityService.delete(id);

// Check user availability at specific date/time
export const checkUserAvailability = (userId: string, params: TQueryParams) => {
  const queryParams: TQueryParams = {};

  if (params.dateTime) {
    queryParams.dateTime = params.dateTime;
  }

  if (params.duration) {
    queryParams.duration = params.duration.toString();
  }

  return userAvailabilityService.getSingle<{
    isAvailable: boolean;
    reason?: string;
  }>(undefined, queryParams, `/${userId}/check-availability`);
};

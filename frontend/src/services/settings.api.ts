// Utils
import type { IUserSettings } from "@shared/interfaces/settings.interface";
import { BaseService } from "./base.service.api";

// Types
import type { TUserSettingsData } from "@shared/types/settings.type";

// Constants
const USER_SETTINGS_API_PATH = "/user-settings";

// Create base service instance
const userSettingsService = new BaseService<
  IUserSettings,
  TUserSettingsData,
  TUserSettingsData
>(USER_SETTINGS_API_PATH);

// Custom endpoints
export const fetchMySettings = () => userSettingsService.getSingle();
export const createOrUpdateMySettings = (data: TUserSettingsData) =>
  userSettingsService.post(data);
export const fetchUserSettingsById = (userId: string) =>
  userSettingsService.getSingle(undefined, undefined, `/${userId}`);

// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IUser, IProfile } from "@shared/interfaces/user.interface";
import type {
  TUserData,
  TUpdateProfileData,
  TUserResetPasswordData,
  TUpdateUserData,
} from "@shared/types/user.type";

// Constants
const USERS_API_PATH = "/users";
const PROFILES_API_PATH = "/users-profile";

// Create base service instances
const userService = new BaseService<IUser, TUserData, Partial<TUserData>>(
  USERS_API_PATH
);
const profileService = new BaseService<
  IProfile,
  TUpdateProfileData,
  TUpdateProfileData
>(`${PROFILES_API_PATH}`);

// Re-export common CRUD operations
export const fetchUsers = (params: IListQueryParams, level?: number) => {
  const additionalParams = level ? { level } : undefined;
  return userService.get({ ...params, ...additionalParams });
};

export const fetchUser = (id: string, params: IListQueryParams) =>
  userService.getSingle(id, params);
export const createUser = (data: TUserData) => userService.post(data);
export const updateUser = (id: string) => userService.patch(id);
export const updateMe = (data: TUpdateUserData) =>
  userService.post(data, undefined, "/me");
export const deleteUser = (id: string) => userService.delete(id);

export const fetchUserProfile = (id: string) =>
  profileService.getSingle(null, undefined, `/${id}/profile`);

export const fetchMyProfile = () => profileService.getSingle();
export const updateMyProfile = () => profileService.patchFormData(null);
export const updateProfile = (id: string) => profileService.patchFormData(id);

export const changePassword = (data: TUserResetPasswordData) =>
  userService.patch(null)(data, undefined, "/me/reset-password");

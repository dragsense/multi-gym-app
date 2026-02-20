import { UserSettingsDto } from "../dtos/settings-dtos/settings.dto";
import type { IMessageResponse } from "./api/response.interface";

export interface IUserSettings extends UserSettingsDto {}
export interface IUserSettingsResponse extends IMessageResponse {}

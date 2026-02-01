import { UserSettingsDto } from "../dtos/settings-dtos/settings.dto";
import { IMessageResponse } from "./api/response.interface";

export interface IUserSettings extends UserSettingsDto {}
export interface IUserSettingsResponse extends IMessageResponse {}

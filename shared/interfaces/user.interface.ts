import { IMessageResponse } from './api/response.interface';
import { ProfileDto, UserDto } from '../dtos/user-dtos';


export interface IUser extends UserDto {};
export interface IProfile extends ProfileDto {}

export type TUserResponse = {user: IUser} & IMessageResponse
  
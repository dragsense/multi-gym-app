import { IUser } from './user.interface';
import { LoginResponseDto, SignupResponseDto } from '../dtos';

export interface IAuthUser extends IUser { }

export interface ILoginResponse extends LoginResponseDto { }

export interface ISignupResponse extends SignupResponseDto { }


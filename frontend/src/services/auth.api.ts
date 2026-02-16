import type { IMessageResponse } from "@shared/interfaces";
import { BaseService } from "./base.service.api";
import {  type IAuthUser, type ILoginResponse } from "@shared/interfaces/auth.interface";
import type {
  TLoginData,
  TSignupData,
  TForgotPasswordData,
  TAuthResetPasswordData,
  TVerifyOtpData,
} from "@shared/types/auth.type";

const AUTH_API_PATH = "/auth";

// Create base service instance
const authService = new BaseService(AUTH_API_PATH);

export const login = (data: TLoginData) =>
  authService.post<ILoginResponse>(data, undefined, "/login");

export const signup = (data: TSignupData) =>
  authService.post(data, undefined, "/signup");

export const me = () => authService.getSingle<IAuthUser>(null, undefined, "/me");

export const verifyOtp = (data: TVerifyOtpData) =>
  authService.post(data, undefined, "/verify-otp");

export const resendOtp = (data: { token: string }) =>
  authService.post(data, undefined, "/resend-otp");

export const forgotPassword = (data: TForgotPasswordData) =>
  authService.post(data, undefined, "/send-reset-link");

export const resetPassword = (data: TAuthResetPasswordData) =>
  authService.post(data, undefined, "/reset-password");

export const logout = () => authService.post({}, undefined, "/logout");

export const logoutAll = () => authService.post({}, undefined, "/logout-all");

/**
 * Validate impersonation token and login
 * @param token - The impersonation token to validate
 * @returns Login response with access token
 */
export const validateImpersonation = (token: string) =>
  authService.post<ILoginResponse>({ token }, undefined, "/impersonate");

import { BaseService } from "./base.service.api";
import type {
  CreatePaysafeApplicationDto,
  PaysafeConnectResponseDto,
  PaysafeConnectStatusDto,
} from "@shared/dtos";

const PAYSAFE_CONNECT_API_PATH = "/paysafe-connect";
const service = new BaseService<any, any, any>(PAYSAFE_CONNECT_API_PATH);

export const getPaysafeConnectStatus = (): Promise<PaysafeConnectStatusDto> =>
  service.getSingle<PaysafeConnectStatusDto>(undefined, undefined);

export const createPaysafeApplication = (
  payload: CreatePaysafeApplicationDto
): Promise<PaysafeConnectResponseDto> =>
  service.post<PaysafeConnectResponseDto>(payload);

export const refreshPaysafeConnectStatus = (): Promise<PaysafeConnectResponseDto> =>
  service.post<PaysafeConnectResponseDto>({}, undefined, "/refresh");

export const disconnectPaysafeConnect = (): Promise<{ message: string }> =>
  service.delete<{ message: string }>(null);


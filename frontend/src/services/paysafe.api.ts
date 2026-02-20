import { apiRequest } from "@/utils/fetcher";

export interface PaysafeSetupDto {
  singleUseTokenApiKey: string;
  environment: string;
}

export const getPaysafeSetup = (): Promise<PaysafeSetupDto> =>
  apiRequest<PaysafeSetupDto>("/paysafe/setup", "GET");

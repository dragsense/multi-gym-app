// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IReferralLink } from "@shared/interfaces/referral-link.interface";
import type {
  TReferralLinkData,
  TUpdateReferralLinkData,
} from "@shared/types/referral-link.type";

// Constants
const REFERRAL_LINKS_API_PATH = "/referral-links";

// Create base service instance
const referralLinkService = new BaseService<
  IReferralLink,
  TReferralLinkData,
  TUpdateReferralLinkData
>(REFERRAL_LINKS_API_PATH);

// Re-export common CRUD operations
export const fetchReferralLinks = (params: IListQueryParams) =>
  referralLinkService.get(params);
export const fetchReferralLink = (id: string, params: IListQueryParams) =>
  referralLinkService.getSingle(id, params);
export const createReferralLink = (data: TReferralLinkData) =>
  referralLinkService.post(data);
export const updateReferralLink = (id: string) => referralLinkService.patch(id);
export const deleteReferralLink = (id: string) =>
  referralLinkService.delete(id);

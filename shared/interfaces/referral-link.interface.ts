import { ReferralLinkDto } from '../dtos';
import type { IMessageResponse } from './api/response.interface';

export interface IReferralLink extends ReferralLinkDto {}
export interface IReferralLinkResponse extends IMessageResponse {
  referralLink: ReferralLinkDto;
}

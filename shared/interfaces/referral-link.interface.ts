import { ReferralLinkDto } from '../dtos';
import { IMessageResponse } from './api/response.interface';

export interface IReferralLink extends ReferralLinkDto {}
export interface IReferralLinkResponse extends IMessageResponse {
  referralLink: ReferralLinkDto;
}

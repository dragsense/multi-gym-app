import { IMessageResponse } from './api/response.interface';
import {
  MemberMembershipDto,
  MemberMembershipHistoryDto,
  MemberMembershipBillingDto,
  MemberMembershipStatusDto,
  CurrentMembershipSummaryDto,
} from '../dtos/membership-dtos';
import { IMembership } from './membership.interface';
import { IMember } from './member.interface';
import { IBilling } from './billing.interface';

export interface IMemberMembership extends MemberMembershipDto {
  member?: IMember;
  membership?: IMembership;
  history?: IMemberMembershipHistory[];
}

export interface IMemberMembershipHistory extends MemberMembershipHistoryDto {
  memberMembership?: IMemberMembership;
}

export interface IMemberMembershipBilling extends MemberMembershipBillingDto {
  memberMembership?: IMemberMembership;
  billing?: IBilling;
}

export interface IMemberMembershipStatus extends MemberMembershipStatusDto {}

export interface ICurrentMembershipSummary extends CurrentMembershipSummaryDto {}

export type TMemberMembershipResponse = { memberMembership: IMemberMembership } & IMessageResponse;

export type TMemberMembershipHistoryResponse = { history: IMemberMembershipHistory[] } & IMessageResponse;

export type TMemberMembershipBillingResponse = { billing: IMemberMembershipBilling } & IMessageResponse;


// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type {
  IMemberMembership,
  IMemberMembershipHistory,
  IMemberMembershipStatus,
  ICurrentMembershipSummary,
} from "@shared/interfaces/member-membership.interface";
import {
  MemberMembershipPaymentIntentDto,
} from "@shared/dtos";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TAdminAssignMembershipData } from "@shared/types/membership.type";

// Constants
const MEMBER_MEMBERSHIPS_API_PATH = "/member-memberships";
const MEMBER_MEMBERSHIP_HISTORY_API_PATH = "/member-membership-history";

// Create base service instances
const memberMembershipService = new BaseService<
  IMemberMembership,
  MemberMembershipPaymentIntentDto,
  Partial<MemberMembershipPaymentIntentDto>
>(MEMBER_MEMBERSHIPS_API_PATH);

const memberMembershipHistoryService = new BaseService<
  IMemberMembershipHistory,
  never,
  never
>(MEMBER_MEMBERSHIP_HISTORY_API_PATH);

// Get member memberships by member ID
export const fetchMemberMemberships = (
  memberId: string,
  params?: IListQueryParams
): Promise<IMemberMembership[]> =>
  memberMembershipService.getAll<IMemberMembership>(
    params as any,
    `/member/${memberId}`
  );

// Get single member membership by ID
export const fetchMemberMembership = (
  id: string,
  params?: Record<string, any>
): Promise<IMemberMembership> =>
  memberMembershipService.getSingle<IMemberMembership>(id, params);

// Create member membership
export const createMemberMembership = (
  data: MemberMembershipPaymentIntentDto
): Promise<IMessageResponse> =>
  memberMembershipService.post<{ message: string }>(data);

// Get member membership status by member membership ID
export const fetchMemberMembershipStatus = (
  memberMembershipId: string
): Promise<IMemberMembershipStatus> =>
  memberMembershipService.getSingle<IMemberMembershipStatus>(
    undefined,
    undefined,
    `/${memberMembershipId}/status`
  );

// Get current membership summary for a member
export const fetchCurrentMembershipSummary = (
  memberId: string
): Promise<ICurrentMembershipSummary> =>
  memberMembershipService.getSingle<ICurrentMembershipSummary>(
    undefined,
    undefined,
    `/member/${memberId}/current-summary`
  );

// Get my membership summary (for current logged-in user)
export const getMyMembershipSummary = (): Promise<ICurrentMembershipSummary> =>
  memberMembershipService.getSingle<ICurrentMembershipSummary>(
    undefined,
    undefined,
    "/me/membership/summary"
  );

// Get member membership history by member membership ID
export const fetchMemberMembershipHistory = (
  memberMembershipId: string,
  params?: IListQueryParams
): Promise<IMemberMembershipHistory[]> =>
  memberMembershipHistoryService.getAll<IMemberMembershipHistory>(
    { ...params, memberMembershipId } as any,
    `/${memberMembershipId}`
  );

// Get membership status from history service
export const fetchMembershipStatusFromHistory = (
  memberMembershipId: string
): Promise<IMemberMembershipStatus> =>
  memberMembershipHistoryService.getSingle<IMemberMembershipStatus>(
    undefined,
    undefined,
    `/${memberMembershipId}/status`
  );

// Get paginated membership history for a member by memberId
export const fetchMemberMembershipHistoryByMemberId = (
  memberId: string,
  params?: IListQueryParams
) => memberMembershipHistoryService.get<IMemberMembershipHistory>(
  params as any,
  `/member/${memberId}`
);

// Get all membership history for a member by memberId (deprecated - use fetchMemberMembershipHistoryByMemberId with pagination)
export const fetchAllMemberMembershipHistory = (
  memberId: string
): Promise<IMemberMembershipHistory[]> =>
  memberMembershipHistoryService.getAll<IMemberMembershipHistory>(
    undefined,
    `/member/${memberId}/all`
  );

// Cancel my current membership
export const cancelMyMembership = (): Promise<IMessageResponse> =>
  memberMembershipService.post<IMessageResponse>(
    {},
    undefined,
    "/me/cancel"
  );

// Cancel membership for a specific member (Admin only)
export const cancelMemberMembership = (memberId: string): Promise<IMessageResponse> =>
  memberMembershipService.post<IMessageResponse>(
    {},
    undefined,
    `/member/${memberId}/cancel`
  );

// Admin assign membership to a member with custom start date
export const adminAssignMembership = (data: TAdminAssignMembershipData): Promise<IMessageResponse> =>
  memberMembershipService.post<IMessageResponse>(
    data,
    undefined,
    "/admin/assign"
  );


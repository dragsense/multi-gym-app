// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { ILinkMember } from "@shared/interfaces/link-member.interface";
import type {
  TLinkMemberData,
  TUpdateLinkMemberData,
} from "@shared/types/link-member.type";

// Constants
const LINK_MEMBERS_API_PATH = "/link-members";

// Create base service instance
const linkMemberService = new BaseService<
  ILinkMember,
  TLinkMemberData,
  TUpdateLinkMemberData
>(LINK_MEMBERS_API_PATH);

// Re-export common CRUD operations
export const fetchLinkMembers = (params: IListQueryParams) =>
  linkMemberService.get(params);

export const fetchCurrentUserLinkMembers = (params: IListQueryParams) =>
  linkMemberService.get(params, "/current-user");

export const fetchLinkMember = (id: string, params: IListQueryParams) =>
  linkMemberService.getSingle(id, params);
export const createLinkMember = (data: TLinkMemberData) => linkMemberService.post(data);
export const updateLinkMember = (id: string) => (data: TUpdateLinkMemberData) => linkMemberService.patch(id)(data);
export const toggleViewSessionCheck = (id: string) => linkMemberService.patch(`${id}/toggle-view-session`)({});
export const deleteLinkMember = (id: string) => linkMemberService.delete(id);

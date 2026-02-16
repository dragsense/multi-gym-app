// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IMember } from "@shared/interfaces/member.interface";
import type { TMemberData } from "@shared/types/member.type";

// Constants
const MEMBERS_API_PATH = "/members";

// Create base service instance
const memberService = new BaseService<
  IMember,
  TMemberData,
  Partial<TMemberData>
>(MEMBERS_API_PATH);

// Re-export common CRUD operations
export const fetchMembers = (params: IListQueryParams) =>
  memberService.get(params);
export const fetchMember = (id: string, params: IListQueryParams) =>
  memberService.getSingle(id, params);
export const createMember = (data: TMemberData) => memberService.post(data);
export const updateMember = (id: string) => memberService.patch(id);
export const deleteMember = (id: string) => memberService.delete(id);

export const getMyMember = (): Promise<IMember | null> =>
  memberService.getSingle<IMember | null>(undefined, undefined, "/me");

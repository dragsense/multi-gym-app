// Utils
import { BaseService } from "../base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IMembership } from "@shared/interfaces/membership.interface";
import { CreateMembershipDto, UpdateMembershipDto } from "@shared/dtos";

// Constants
const MEMBERSHIPS_API_PATH = "/memberships";

// Create base service instance
const membershipService = new BaseService<
  IMembership,
  CreateMembershipDto,
  UpdateMembershipDto
>(MEMBERSHIPS_API_PATH);

// Re-export common CRUD operations
export const fetchMemberships = (params: IListQueryParams) => membershipService.get<IMembership>(params);
export const fetchMembership = (id: string) => membershipService.getSingle<IMembership>(id);
export const deleteMembership = (id: string) => membershipService.delete(id);

// Membership-specific methods
export const createMembership = (data: CreateMembershipDto) =>
  membershipService.post(data);
export const updateMembership = (id: string) => membershipService.patch(id);


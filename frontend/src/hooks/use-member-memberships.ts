// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchMemberMemberships } from "@/services/member-membership.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";

interface IUseMemberMembershipsParams {
  memberId: string;
  params?: IListQueryParams;
  enabled?: boolean;
}

/**
 * Hook to fetch member memberships for a specific member
 */
export function useMemberMemberships({ 
  memberId, 
  params,
  enabled = true 
}: IUseMemberMembershipsParams) {
  return useQuery<any[]>({
    queryKey: ["member-memberships", memberId, params],
    queryFn: () => fetchMemberMemberships(memberId, params),
    enabled: !!memberId && enabled,
  });
}


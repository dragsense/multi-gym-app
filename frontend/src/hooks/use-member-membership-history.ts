// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchMemberMembershipHistory } from "@/services/member-membership.api";

interface IUseMemberMembershipHistoryParams {
  memberMembershipId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch membership history for a specific member membership
 */
export function useMemberMembershipHistory({ 
  memberMembershipId,
  enabled = true 
}: IUseMemberMembershipHistoryParams) {
  return useQuery<any[]>({
    queryKey: ["member-membership-history", memberMembershipId],
    queryFn: () => fetchMemberMembershipHistory(memberMembershipId),
    enabled: !!memberMembershipId && enabled,
  });
}


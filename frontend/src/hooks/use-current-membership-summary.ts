// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchCurrentMembershipSummary } from "@/services/member-membership.api";

interface IUseCurrentMembershipSummaryParams {
  memberId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch current membership summary for a member
 */
export function useCurrentMembershipSummary({ 
  memberId, 
  enabled = true 
}: IUseCurrentMembershipSummaryParams) {
  return useQuery({
    queryKey: ["current-membership-summary", memberId],
    queryFn: () => fetchCurrentMembershipSummary(memberId),
    enabled: !!memberId && enabled,
  });
}


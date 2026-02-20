// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchMemberships } from "@/services/membership/membership.api";

// Types
import type { IMembership } from "@shared/interfaces";

/**
 * Hook to fetch all active memberships
 */
export function useActiveMemberships() {
  return useQuery<{ data: IMembership[] }>({
    queryKey: ["active-memberships"],
    queryFn: () => fetchMemberships({
    page: 1,
    limit: 100,
    enabled: "true",
    _relations: "doors,doors.location",
  } as any),
  });
}


import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getMyMembershipSummary } from "@/services/member-membership.api";
import type { ICurrentMembershipSummary } from "@shared/interfaces/member-membership.interface";

export const useMyMembershipSummary = (
  options?: Omit<UseQueryOptions<ICurrentMembershipSummary, Error>, "queryKey" | "queryFn">
) => {
  const {
    data: summary,
    isLoading,
    error,
    refetch,
    ...rest
  } = useQuery<ICurrentMembershipSummary, Error>({
    queryKey: ["my-membership-summary"],
    queryFn: getMyMembershipSummary,
    retry: false,
    ...options,
  });

  return {
    summary,
    isActive: summary?.status === "ACTIVE",
    isLoading,
    error,
    refetch,
    ...rest,
  };
};

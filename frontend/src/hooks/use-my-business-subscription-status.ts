import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getMyBusinessSubscriptionStatus } from "@/services/business/business-subscription.api";
import type { BusinessSubscriptionStatusDto } from "@shared/dtos";
import { ESubscriptionStatus } from "@shared/enums";

export const useMyBusinessSubscriptionStatus = (
  options?: Omit<UseQueryOptions<BusinessSubscriptionStatusDto, Error>, "queryKey" | "queryFn">
) => {
  const {
    data: status,
    isLoading,
    error,
    refetch,
    ...rest
  } = useQuery<BusinessSubscriptionStatusDto, Error>({
    queryKey: ["my-business-subscription-status"],
    queryFn: getMyBusinessSubscriptionStatus,
    retry: false,
    staleTime: 0, // Data is immediately stale, no caching
    gcTime: 0, // Don't keep in cache
    ...options,
  });

  return {
    status: status?.status || ESubscriptionStatus.INACTIVE,
    activatedAt: status?.activatedAt || null,
    isActive: status?.status === ESubscriptionStatus.ACTIVE,
    isLoading,
    error,
    refetch,
    ...rest,
  };
};

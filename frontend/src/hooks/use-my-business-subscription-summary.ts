import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getMyBusinessSubscriptionSummary } from "@/services/business/business-subscription.api";
import type { CurrentBusinessSubscriptionSummaryDto } from "@shared/dtos";
import { ESubscriptionStatus } from "@shared/enums";

export const useMyBusinessSubscriptionSummary = (
  options?: Omit<UseQueryOptions<CurrentBusinessSubscriptionSummaryDto, Error>, "queryKey" | "queryFn">
) => {
  const {
    data: summary,
    isLoading,
    error,
    refetch,
    ...rest
  } = useQuery<CurrentBusinessSubscriptionSummaryDto, Error>({
    queryKey: ["my-business-subscription-summary"],
    queryFn: getMyBusinessSubscriptionSummary,
    retry: false,
    ...options,
  });

  return {
    summary,
    isActive: summary?.status === ESubscriptionStatus.ACTIVE,
    isLoading,
    error,
    refetch,
    ...rest,
  };
};

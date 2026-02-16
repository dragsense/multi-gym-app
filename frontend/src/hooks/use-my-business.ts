import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getMyBusiness } from "@/services/business/business.api";
import type { IBusiness } from "@shared/interfaces";

export const useMyBusiness = (
  options?: Omit<UseQueryOptions<IBusiness | null, Error>, "queryKey" | "queryFn">
) => {
  const {
    data: business,
    isLoading,
    error,
    refetch,
    ...rest
  } = useQuery<IBusiness | null, Error>({
    queryKey: ["my-business"],
    queryFn: getMyBusiness,
    retry: false,
    ...options,
  });

  return {
    business,
    hasBusiness: !!business,
    isLoading,
    error,
    refetch,
    ...rest,
  };
};

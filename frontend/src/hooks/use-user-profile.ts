import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchUserProfile } from "@/services/user.api";
import type { IProfile } from "@shared/interfaces/user.interface";

export function useUserProfile(
  userId: string | undefined,
  options?: Omit<UseQueryOptions<IProfile, Error>, "queryKey" | "queryFn">
) {
  const {
    data: profile,
    isLoading,
    error,
    refetch,
    ...rest
  } = useQuery<IProfile, Error>({
    queryKey: ["user-profile", userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    retry: false,
    ...options,
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
    ...rest,
  };
}


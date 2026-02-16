import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getMyMember } from "@/services/member.api";
import type { IMember } from "@shared/interfaces/member.interface";

export const useMyMember = (
  options?: Omit<UseQueryOptions<IMember | null, Error>, "queryKey" | "queryFn">
) => {
  const {
    data: member,
    isLoading,
    error,
    refetch,
    ...rest
  } = useQuery<IMember | null, Error>({
    queryKey: ["my-member"],
    queryFn: getMyMember,
    retry: false,
    ...options,
  });

  return {
    member,
    hasMember: !!member,
    isLoading,
    error,
    refetch,
    ...rest,
  };
};

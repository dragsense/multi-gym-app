import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMyRewardPoints,
  type IUserRewardPointsResponse,
} from "@/services/rewards.api";
import { rewardsService } from "@/services/socket-services/rewards.service";

const QUERY_KEYS = {
  points: ["rewards", "points"],
} as const;

export function useUserRewardPoints() {
  const queryClient = useQueryClient();

  const query = useQuery<IUserRewardPointsResponse, Error>({
    queryKey: QUERY_KEYS.points,
    queryFn: getMyRewardPoints,
  });

  // Listen for live reward updates and invalidate cache
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.points });
    };
    const unsubscribe = rewardsService.onRewardsUpdated(handler);
    return unsubscribe;
  }, [queryClient]);

  return query;
}

// Single-endpoint requirement: history hook omitted

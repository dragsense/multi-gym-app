// Utils
import { BaseService } from "./base.service.api";

// Constants
const REWARDS_API_PATH = "/rewards";

// Minimal types for responses
export interface IUserRewardPointsResponse {
  points: number;
}

// We only expose total points via a single endpoint per requirements

// Create base service instance
const rewardsService = new BaseService<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>
>(REWARDS_API_PATH);

// Custom endpoints
export const getMyRewardPoints = () =>
  rewardsService.getSingle<IUserRewardPointsResponse>(
    undefined,
    undefined,
    "/points"
  );
// Single endpoint: get current user's total reward points

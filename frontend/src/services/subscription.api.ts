// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { ISubscription } from "@shared/interfaces/business";
import type { TSubscriptionData } from "@shared/types/business";

// Constants
const SUBSCRIPTIONS_API_PATH = "/subscriptions";

// Create base service instance
const subscriptionService = new BaseService<
  ISubscription,
  TSubscriptionData,
  Partial<TSubscriptionData>
>(SUBSCRIPTIONS_API_PATH);

// Re-export common CRUD operations
export const fetchSubscriptions = (params: IListQueryParams) =>
  subscriptionService.get(params);

export const fetchSubscription = (id: string, params: IListQueryParams) =>
  subscriptionService.getSingle(id, params);

export const createSubscription = (data: TSubscriptionData) =>
  subscriptionService.post(data);

export const updateSubscription = (id: string) => subscriptionService.patch(id);

export const deleteSubscription = (id: string) =>
  subscriptionService.delete(id);

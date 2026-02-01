// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { INotification } from "@shared/interfaces/notification.interface";
import type { IPushSubscription } from "@shared/interfaces/push-subscription.interface";
import type {
  TPushSubscriptionData,
  TPushSubscriptionResponse,
  TPushSubscriptionsListResponse,
  TUnsubscribePushResponse,
} from "@shared/types/notification.type";

// Constants
const NOTIFICATIONS_API_PATH = "/notifications";
const PUSH_SUBSCRIPTIONS_API_PATH = `${NOTIFICATIONS_API_PATH}/push`;

// Create base service instances
const notificationService = new BaseService<
  INotification,
  Record<string, unknown>,
  Record<string, unknown>
>(NOTIFICATIONS_API_PATH);

const pushSubscriptionService = new BaseService<
  IPushSubscription,
  TPushSubscriptionData & Record<string, unknown>,
  Record<string, unknown>
>(PUSH_SUBSCRIPTIONS_API_PATH);

// Re-export common CRUD operations
export const fetchNotifications = (params: IListQueryParams) =>
  notificationService.get(params);

export const markNotificationAsRead = (id: string) =>
  notificationService.put(undefined)({}, undefined, `/${id}/read`);

export const markAllNotificationsAsRead = () =>
  notificationService.put(undefined)({}, undefined, `/read-all`);

// Push notification subscription methods
export const subscribeToPush = (data: TPushSubscriptionData) =>
  pushSubscriptionService.post<TPushSubscriptionResponse>(
    data as unknown as Record<string, unknown>,
    undefined,
    "/subscribe"
  );

export const unsubscribeFromPush = (endpoint: string) =>
  pushSubscriptionService.delete<TUnsubscribePushResponse>(
    null,
    { endpoint },
    "/unsubscribe"
  );

export const getPushSubscriptions = () =>
  pushSubscriptionService
    .getAll<IPushSubscription>(undefined, "/subscriptions")
    .then((subscriptions) => ({
      subscriptions,
      count: subscriptions.length,
    })) as Promise<TPushSubscriptionsListResponse>;

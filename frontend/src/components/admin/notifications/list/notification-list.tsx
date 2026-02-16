// React & Hooks
import { useId, useMemo } from "react";
import { Bell, Loader2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Layout Components
import { AppCard } from "@/components/layout-ui/app-card";

// Hooks
import { useI18n } from "@/hooks/use-i18n";

// Utils
import { buildSentence } from "@/locales/translations";

// Types
import type { INotification } from "@shared/interfaces/notification.interface";

// Local
import { notificationItemViews } from "./notification-item-views";

export interface INotificationListProps {
  notifications: INotification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

/**
 * Main Notification List Component
 * Refined to focus on grouped view with load more functionality.
 */
export default function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onLoadMore,
  hasMore,
}: INotificationListProps) {
  // React 19: Essential IDs
  const componentId = useId();
  const { t } = useI18n();

  const safeNotifications = useMemo(() => notifications || [], [notifications]);

  const { getNotificationsWithDateInfo, renderNotificationItem } = useMemo(
    () => notificationItemViews({ handleMarkAsRead: onMarkAsRead, isLoading, componentId, t }),
    [onMarkAsRead, isLoading, componentId, t]
  );

  const notificationsWithDateInfo = useMemo(() => {
    if (safeNotifications.length === 0) return [];
    return getNotificationsWithDateInfo(safeNotifications);
  }, [safeNotifications, getNotificationsWithDateInfo]);


  return (
    <div className="flex flex-col" data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {buildSentence(t, "all", "notifications")}
            </h3>
            {safeNotifications.some(n => !n.isRead) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAllAsRead}
                disabled={isLoading}
                className="ml-auto"
              >
                {buildSentence(t, "mark", "all", "as", "read")}
              </Button>
            )}
          </div>
        }
        className="flex flex-col"
      >
        <div className="flex flex-col">
          {isLoading && safeNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center ">
                <Loader2 className="mx-auto h-12 bg w-12 text-muted-foreground animate-spin" />
                <p className="mt-4 text-muted-foreground">
                  {buildSentence(t, "loading", "notifications")}...
                </p>
              </div>
            </div>
          ) : safeNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 ">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Bell className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {buildSentence(t, "no", "notifications", "found")}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {buildSentence(t, "you", "will", "see", "your", "notifications", "here", "when", "you", "receive", "them")}
              </p>
            </div>
          ) : (
            <>
              {/* Inner List - Fixed height to ensure local scrolling and prevent global scrollbar */}
              <div className="h-[calc(100vh-450px)] min-h-[400px] overflow-y-auto overflow-x-hidden px-4 py-2 scroll-smooth">
                <div className="space-y-4">
                  {notificationsWithDateInfo.map(({ notification, dateGroup, isFirstInGroup }) =>
                    renderNotificationItem(notification, dateGroup, isFirstInGroup)
                  )}
                </div>
              </div>

              {/* Load More instead of Pagination */}
              {hasMore && (
                <div className="border-t p-4 bg-background/50 backdrop-blur-sm mt-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLoadMore}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("loading")}
                      </>
                    ) : (
                      buildSentence(t, "load", "more")
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </AppCard>
    </div>
  );
}

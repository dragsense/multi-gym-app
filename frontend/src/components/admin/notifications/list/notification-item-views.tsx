// React & Hooks
import { useMemo } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { DateTime } from "luxon";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Layout Components
import { AppCard } from "@/components/layout-ui/app-card";

// Hooks
import { useI18n } from "@/hooks/use-i18n";

// Utils
import { buildSentence } from "@/locales/translations";
import { cn } from "@/lib/utils";

// Types
import type { INotification } from "@shared/interfaces/notification.interface";

// Memoized notification item component
interface INotificationItemProps {
  notification: INotification;
  onMarkAsRead: (id: string) => void;
  isMarkingAsRead: boolean;
  dateGroup: string;
  isFirstInGroup: boolean;
  key?: string | number;
}

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  isMarkingAsRead,
  dateGroup,
  isFirstInGroup,
}: INotificationItemProps) => {
  const { t } = useI18n();
  const isRead = notification.isRead;
  const relativeTime = useMemo(() => {
    const date =
      typeof notification.createdAt === "string"
        ? DateTime.fromISO(notification.createdAt)
        : DateTime.fromJSDate(new Date(notification.createdAt));
    return date.toRelative();
  }, [notification.createdAt]);

  return (
    <>
      {isFirstInGroup && (
        <div className="mx-1 z-10 bg-background/95 backdrop-blur-sm border-b rounded-md border-border/40 py-3 mb-4 -mx-6 px-6">
          <span className="text-sm font-medium text-muted-foreground">{dateGroup}</span>
        </div>
      )}
      <AppCard
        className={cn(
          "p-4 transition-colors",
          !isRead && "bg-primary/5 border-l-4 border-l-primary"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              {!isRead && (
                <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{relativeTime}</span>
              {notification.type && (
                <Badge variant="secondary" className="text-xs">
                  {notification.type}
                </Badge>
              )}
            </div>
          </div>
          {!isRead && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMarkAsRead(notification.id)}
              disabled={isMarkingAsRead}
              className="flex-shrink-0"
              title={buildSentence(t, "mark", "as", "read")}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AppCard>
    </>
  );
};

export const notificationItemViews = ({
  handleMarkAsRead,
  isLoading,
  componentId,
  t,
}: {
  handleMarkAsRead: (id: string) => void;
  isLoading: boolean;
  componentId: string;
  t: (key: string) => string;
}) => {
  // Pre-compute date group info for notifications
  const getNotificationsWithDateInfo = (
    notifications: INotification[]
  ): Array<{
    notification: INotification;
    dateGroup: string;
    isFirstInGroup: boolean;
  }> => {
    const today = DateTime.now().startOf("day");
    const yesterday = today.minus({ days: 1 });
    const dateGroups: Record<string, { label: string; firstId: string | null }> = {};

    return notifications.map((notification) => {
      const dateObj =
        typeof notification.createdAt === "string"
          ? DateTime.fromISO(notification.createdAt)
          : DateTime.fromJSDate(new Date(notification.createdAt));
      const date = dateObj.toFormat("yyyy-MM-dd");

      // Compute date label if not already computed for this date
      if (!dateGroups[date]) {
        let dateLabel: string;
        if (dateObj.hasSame(today, "day")) {
          dateLabel = t("today");
        } else if (dateObj.hasSame(yesterday, "day")) {
          dateLabel = t("yesterday");
        } else {
          dateLabel = dateObj.toFormat("MMMM d, yyyy");
        }
        dateGroups[date] = { label: dateLabel, firstId: null };
      }

      // Mark first notification in each date group
      if (dateGroups[date].firstId === null) {
        dateGroups[date].firstId = notification.id;
      }

      const isFirstInGroup = dateGroups[date].firstId === notification.id;

      return {
        notification,
        dateGroup: dateGroups[date].label,
        isFirstInGroup,
      };
    });
  };

  const renderNotificationItem = (notification: INotification, dateGroup: string, isFirstInGroup: boolean) => {
    return (
      <NotificationItem
        key={notification.id}
        notification={notification}
        onMarkAsRead={handleMarkAsRead}
        isMarkingAsRead={isLoading}
        dateGroup={dateGroup}
        isFirstInGroup={isFirstInGroup}
      />
    );
  };

  return {
    getNotificationsWithDateInfo,
    renderNotificationItem,
  };
};


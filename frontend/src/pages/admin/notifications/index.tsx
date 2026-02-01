// Hooks
import { useNotifications } from "@/hooks/use-notifications";

// Components
import { NotificationList } from "@/components/admin/notifications";

// Layouts
import { PageInnerLayout } from "@/layouts";

// DTOs
import { NotificationListDto } from "@shared/dtos";

// Types
import type { INotificationListExtraProps } from "@/components/admin/notifications/list/notification-list";

export default function NotificationsPage() {
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    loadMore,
    hasMore,
  } = useNotifications();

  return (
    <PageInnerLayout Header={<Header />}>
      <NotificationList
        notifications={notifications}
        isLoading={isLoading}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />
    </PageInnerLayout>
  );
}

const Header = () => null;

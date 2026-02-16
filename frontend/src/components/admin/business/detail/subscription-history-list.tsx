// React
import { useId, useMemo, useCallback } from "react";

// Types
import type { BusinessSubscriptionHistoryDto } from "@shared/dtos";
import type { TListHandlerStore } from "@/stores";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { List as TList } from "@/components/list-ui/list";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Circle, 
  History,
  Calendar,
} from "lucide-react";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDate, formatDateTime } from "@/lib/utils";
import { buildSentence } from "@/locales/translations";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { ESubscriptionStatus } from "@shared/enums";

interface ISubscriptionHistoryListProps {
  storeKey: string;
  store: TListHandlerStore<BusinessSubscriptionHistoryDto, any, any>;
}

export function SubscriptionHistoryList({ storeKey, store }: ISubscriptionHistoryListProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();

  // Only subscribe to pagination for the header - let TList handle items and loading
  const { pagination } = store(
    useShallow((state) => ({
      pagination: state.pagination,
    }))
  );

  const getStatusConfig = (status: string) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case "ACTIVE":
        return {
          icon: CheckCircle2,
          iconColor: "text-emerald-600",
          badgeVariant: "default" as const,
          dotColor: "bg-emerald-500",
        };
      case "EXPIRED":
      case "CANCELLED":
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          badgeVariant: "destructive" as const,
          dotColor: "bg-red-500",
        };
      case "INACTIVE":
        return {
          icon: AlertCircle,
          iconColor: "text-amber-600",
          badgeVariant: "secondary" as const,
          dotColor: "bg-amber-500",
        };
      default:
        return {
          icon: Circle,
          iconColor: "text-gray-500",
          badgeVariant: "outline" as const,
          dotColor: "bg-gray-400",
        };
    }
  };

  const renderTimelineItem = useCallback((item: BusinessSubscriptionHistoryDto, index: number) => {
    const status = item.status || "UNKNOWN";
    const config = getStatusConfig(status);
    const IconComponent = config.icon;
    const subscription = (item as any).businessSubscription?.subscription || (item as any).subscription;
    const occurredAt = item.occurredAt || (item as any).createdAt;
    const message = item.message || "";
    const source = item.source || "";
    const startDate = item.startDate;
    const endDate = item.endDate;

    return (
      <div key={item.id || index} className="relative flex gap-5 group">
        {/* Timeline dot */}
        <div className="relative z-10 flex-shrink-0">
          <div className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
            "bg-background border-border shadow-sm",
            "group-hover:shadow-md"
          )}>
            <IconComponent className={cn("h-5 w-5", config.iconColor)} />
          </div>
        </div>

        {/* Content card */}
        <div
          className={cn(
            "flex-1 rounded-lg border transition-all duration-200",
            "hover:shadow-md",
            "bg-card border-border"
          )}
        >
          <div className="p-5 space-y-3">
            {/* Header: Status and Subscription Name */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge 
                    variant={config.badgeVariant} 
                    className="flex-shrink-0 font-medium px-2.5 py-1"
                  >
                    {status}
                  </Badge>
                  {subscription?.name && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-foreground">
                        {subscription.name}
                      </span>
                      {subscription.color && (
                        <div
                          className="h-3 w-3 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: subscription.color }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Date Range */}
                {(startDate || endDate) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    {startDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="font-medium">{buildSentence(t, "start")}:</span>
                        <span>{formatDate(startDate, settings)}</span>
                      </div>
                    )}
                    {endDate && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{buildSentence(t, "end")}:</span>
                        <span>{formatDate(endDate, settings)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date */}
              {occurredAt && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    <div className="font-medium text-foreground">
                      {formatDate(occurredAt, settings)}
                    </div>
                    <div className="text-[10px] mt-0.5">
                      {formatDateTime(occurredAt, settings).split(" ")[1] || ""}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <p className="text-sm text-foreground leading-relaxed pl-1">
                {message}
              </p>
            )}

            {/* Source */}
            {source && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <span className="font-medium">{t("source")}:</span>
                <span className="capitalize">{source.replace(/_/g, " ").toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [settings, t]);

  return (
    <AppCard
      header={
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">{buildSentence(t, "subscription", "history")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pagination.total} {pagination.total === 1 ? t("entry") : t("entries")} {t("total")}
            </p>
          </div>
        </div>
      }
      data-component-id={componentId}
    >
      <div className="relative pl-2">
        {/* Timeline line - same as membership history */}
        <div className="absolute left-[26px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-border via-border to-transparent" />

        {/* Timeline items using TList for pagination */}
        <TList<BusinessSubscriptionHistoryDto>
          listStore={store}
          emptyMessage={buildSentence(t, "no", "subscription", "history", "found")}
          showPagination={true}
          renderItem={renderTimelineItem}
          className="space-y-6"
          rowClassName=""
          colClassName="space-y-6"
        />
      </div>
    </AppCard>
  );
}

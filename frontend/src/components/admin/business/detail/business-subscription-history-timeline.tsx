// React
import { useId } from "react";

// Types
import type { IBusiness } from "@shared/interfaces";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Circle, 
  ChevronLeft, 
  ChevronRight,
  History,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useAllBusinessSubscriptionHistory } from "@/hooks/use-all-business-subscription-history";
import { formatDate, formatDateTime } from "@/lib/utils";
import { buildSentence } from "@/locales/translations";
import { cn } from "@/lib/utils";

interface IBusinessSubscriptionHistoryTimelineProps {
  business: IBusiness;
  initialLimit?: number;
}

export function BusinessSubscriptionHistoryTimeline({ 
  business, 
  initialLimit = 10 
}: IBusinessSubscriptionHistoryTimelineProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();

  const {
    data: items,
    isLoading,
    pagination,
    setPage,
  } = useAllBusinessSubscriptionHistory({
    businessId: business.id,
    initialLimit,
  });

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

  if (isLoading) {
    return (
      <AppCard
        header={
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{buildSentence(t, "subscription", "history")}</h3>
          </div>
        }
        data-component-id={componentId}
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="flex-1 h-24 rounded-lg" />
            </div>
          ))}
        </div>
      </AppCard>
    );
  }

  if (!items || items.length === 0) {
    return (
      <AppCard
        header={
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{buildSentence(t, "subscription", "history")}</h3>
          </div>
        }
        data-component-id={componentId}
      >
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Clock className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            {buildSentence(t, "no", "subscription", "history", "found")}
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            {buildSentence(t, "subscription", "history", "will", "appear", "here")}
          </p>
        </div>
      </AppCard>
    );
  }

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
        {/* Timeline line */}
        <div className="absolute left-[26px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-border via-border to-transparent" />

        {/* Timeline items */}
        <div className="space-y-6">
          {items.map((item, index: number) => {
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
                          {subscription?.title && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base text-foreground">
                                {subscription.title}
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
          })}
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.total > pagination.limit && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            {buildSentence(t, "showing")} <span className="font-semibold text-foreground">
              {((pagination.page - 1) * pagination.limit) + 1}
            </span> {t("to")}{" "}
            <span className="font-semibold text-foreground">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span> {t("of")}{" "}
            <span className="font-semibold text-foreground">{pagination.total}</span> {t("entries")}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("previous")}
            </Button>
            <div className="text-sm text-muted-foreground px-2">
              {buildSentence(t, "page")} {pagination.page} {t("of")} {pagination.lastPage}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="gap-1.5"
            >
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AppCard>
  );
}

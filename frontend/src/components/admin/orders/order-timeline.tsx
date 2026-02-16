import { useMemo } from "react";
import { CheckCircle2, Clock, Package, Truck, XCircle, RefreshCcw } from "lucide-react";
import type { IOrderHistory } from "@shared/interfaces/order-history.interface";
import { EOrderStatus } from "@shared/enums/order.enum";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDateTime } from "@/utils";

interface IOrderTimelineProps {
  history?: IOrderHistory[];
}

const getStatusIcon = (status: EOrderStatus) => {
  switch (status) {
    case EOrderStatus.PENDING:
      return <Clock className="h-4 w-4" />;
    case EOrderStatus.SHIPPED:
      return <Truck className="h-4 w-4" />;
    case EOrderStatus.FULFILLED:
      return <Package className="h-4 w-4" />;
    case EOrderStatus.CANCELLED:
      return <XCircle className="h-4 w-4" />;
    case EOrderStatus.REFUNDED:
      return <RefreshCcw className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusColor = (status: EOrderStatus) => {
  switch (status) {
    case EOrderStatus.PENDING:
      return "text-yellow-600 bg-yellow-100 border-yellow-200";
    case EOrderStatus.SHIPPED:
      return "text-blue-600 bg-blue-100 border-blue-200";
    case EOrderStatus.FULFILLED:
      return "text-green-600 bg-green-100 border-green-200";
    case EOrderStatus.CANCELLED:
      return "text-gray-600 bg-gray-100 border-gray-200";
    case EOrderStatus.REFUNDED:
      return "text-purple-600 bg-purple-100 border-purple-200";
    default:
      return "text-gray-600 bg-gray-100 border-gray-200";
  }
};

export function OrderTimeline({ history }: IOrderTimelineProps) {
  const { t } = useI18n();
  const { settings: userSettings } = useUserSettings();

  const sortedHistory = useMemo(() => {
    if (!history?.length) return [];
    return [...history].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    });
  }, [history]);

  if (!sortedHistory.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("noHistoryAvailable") || "No history available"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedHistory.map((entry, index) => {
        const isLast = index === sortedHistory.length - 1;
        const statusColor = getStatusColor(entry.status);
        const statusIcon = getStatusIcon(entry.status);

        return (
          <div key={entry.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
            )}

            {/* Status icon */}
            <div
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${statusColor}`}
            >
              {statusIcon}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {buildSentence(t, entry.status.toLowerCase())}
                    </span>
                    {entry.source && (
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                        {entry.source.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>

                  {entry.message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {entry.message}
                    </p>
                  )}

                  {entry.changedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {buildSentence(t, "by")}{" "}
                      {entry.changedBy.firstName} {entry.changedBy.lastName}
                    </p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {entry.createdAt &&
                    formatDateTime(
                      entry.createdAt,
                    )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

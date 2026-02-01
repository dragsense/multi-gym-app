// React
import { useId, type ReactNode } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, DollarSign, Clock, type LucideIcon } from "lucide-react";

export interface IPlanSummaryDetail {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
}

export interface ICurrentPlanSummaryCardProps {
  /** Card title (e.g., "Current Subscription", "Current Membership") */
  title: string;
  /** Plan name (e.g., "Premium Plan", "Gold Membership") */
  planName?: string | null;
  /** Plan description */
  description?: string | null;
  /** Status string (e.g., "ACTIVE", "INACTIVE", "EXPIRED") */
  status?: string | null;
  /** Whether the plan is active */
  isActive: boolean;
  /** Color for the plan indicator */
  color?: string | null;
  /** Array of detail items to display in the grid */
  details?: IPlanSummaryDetail[];
  /** Message to show when there's no active plan */
  emptyMessage?: string;
  /** Whether the data is loading */
  isLoading?: boolean;
  /** Custom header icon */
  headerIcon?: LucideIcon;
  /** Action content (buttons, etc.) to display at the bottom */
  actionContent?: ReactNode;
}

const formatBillingFrequency = (freq: string | undefined | null): string => {
  if (!freq) return "";
  return freq
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const getStatusBadgeVariant = (status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "INACTIVE":
      return "secondary";
    case "EXPIRED":
      return "destructive";
    case "CANCELLED":
      return "outline";
    case "SUSPENDED":
      return "destructive";
    default:
      return "secondary";
  }
};

export function CurrentPlanSummaryCard({
  title,
  planName,
  description,
  status,
  isActive,
  color,
  details = [],
  emptyMessage = "No active plan",
  isLoading = false,
  headerIcon: HeaderIcon = CreditCard,
  actionContent,
}: ICurrentPlanSummaryCardProps) {
  const componentId = useId();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <AppCard
      header={
        <div className="flex items-center gap-2">
          <HeaderIcon className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      }
      data-component-id={componentId}
    >
      {isActive ? (
        <div className="space-y-4">
          {/* Header with name and status badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                {planName && (
                  <h4 className="font-semibold text-lg">{planName}</h4>
                )}
                {status && (
                  <Badge variant={getStatusBadgeVariant(status)}>
                    {status}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {color && (
              <div
                className="w-12 h-12 rounded-lg shrink-0"
                style={{ backgroundColor: color }}
              />
            )}
          </div>

          {/* Details Grid */}
          {details.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              {details.map((detail, index) => {
                const Icon = detail.icon;
                return (
                  <div key={index} className="flex items-start gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{detail.label}</p>
                      <p className="text-sm font-semibold">
                        {detail.value}
                        {detail.subValue && (
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            {detail.subValue}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Content */}
          {actionContent && (
            <div className="pt-4 border-t">
              {actionContent}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground space-y-4">
          <p>{emptyMessage}</p>
          {actionContent}
        </div>
      )}
    </AppCard>
  );
}

// Helper function to format billing frequency
export { formatBillingFrequency };

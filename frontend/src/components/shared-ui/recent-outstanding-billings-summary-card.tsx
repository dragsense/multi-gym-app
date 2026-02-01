// React
import { useId } from "react";

// Types
import type { IBilling } from "@shared/interfaces/billing.interface";
import type { IUser } from "@shared/interfaces/user.interface";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Receipt, DollarSign, Calendar, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Hooks
import { useOutstandingBillingSummary } from "@/hooks/use-user-billings";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";

interface IRecentOutstandingBillingSummaryCardProps {
  user: IUser;
}

const PAGINATION_LIMIT = 5;
const DEFAULT_LIMIT = 100;

export function RecentOutstandingBillingSummaryCard({ user }: IRecentOutstandingBillingSummaryCardProps) {
  const componentId = useId();

  // Fetch outstanding billing summary using hook with pagination
  const { data, isLoading, pagination, setPage, setLimit } = useOutstandingBillingSummary({
    userId: user.id as string,
    params: {
      limit: DEFAULT_LIMIT,
    }
  }, PAGINATION_LIMIT);

  const billings = data?.recentBillings || [];
  const totalOutstanding = data?.totalOutstanding || 0;
  const totalOutstandingCount = data?.totalOutstandingCount || 0;

  return (
    <AppCard
      header={
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Outstanding Billing Summary</h3>
        </div>
      }
      data-component-id={componentId}
      loading={isLoading}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-red-100 p-2 rounded-md">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Outstanding:</span>
            </div>
            <span className="text-lg font-bold">{formatCurrency(totalOutstanding)}</span>
          </div>
          {totalOutstandingCount > 0 && (
            <div className="flex items-center justify-end">
              <span className="text-xs text-muted-foreground">
                {totalOutstandingCount} {totalOutstandingCount === 1 ? 'billing' : 'billings'} outstanding
              </span>
            </div>
          )}
        </div>
        {billings.length > 0 ? (
          <>
            <div className="space-y-3">
              {billings.map((billing) => (
                <BillingItem key={billing.id} billing={billing} />
              ))}
            </div>
            {pagination.total > PAGINATION_LIMIT && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No billings found
          </div>
        )}
      </div>
    </AppCard>
  );
}

// BillingItem component (moved from billing-item.tsx)
interface IBillingItemProps {
  billing: IBilling;
}

function BillingItem({ billing }: IBillingItemProps) {
  const componentId = useId();
  const { settings } = useUserSettings();

  const billingData = billing as any;
  const invoiceRef = billingData.invoiceRef || billing.id;
  const amount = billingData.amount || 0;
  const title = billing.title || "";
  const type = billing.type;

  // Status badge configuration
  const getStatusVariant = () => {
    if (billing.status === 'PAID') return 'default';
    if (billing.status === 'PENDING') return 'destructive';
    if (billing.status === 'OVERDUE') return 'destructive';
    return 'outline';
  };

  // Build tooltip content with complete information
  const tooltipContent = (
    <div className="space-y-1.5 text-xs">
      <div>
        <span className="font-semibold">Invoice:</span> {invoiceRef}
      </div>
      {title && (
        <div>
          <span className="font-semibold">Title:</span> {title}
        </div>
      )}
      <div>
        <span className="font-semibold">Amount:</span> {formatCurrency(amount, undefined, undefined, 2, 2, settings)}
      </div>
      <div>
        <span className="font-semibold">Status:</span> {billing.status || 'UNKNOWN'}
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-component-id={componentId}
            className="group relative p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Section - Main Info */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Header: Invoice Ref and Status */}
                <div className="">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold text-sm truncate">
                      {invoiceRef}
                    </span>
                  </div>
                  <Badge variant={getStatusVariant()} className="flex-shrink-0">
                    {billing.status || 'UNKNOWN'}
                  </Badge>
                </div>

          

                {/* Type */}
                {type && (
                  <div className="text-xs text-muted-foreground">
                    {type}
                  </div>
                )}
              </div>

              {/* Right Section - Amount */}
              <div className="flex flex-col items-end justify-start gap-1 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-xs">Amount</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {formatCurrency(amount, undefined, undefined, 2, 2, settings)}
                </div>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


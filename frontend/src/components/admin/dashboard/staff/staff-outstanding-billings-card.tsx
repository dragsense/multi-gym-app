// React
import { useId } from "react";

// Types
import type { IBilling } from "@shared/interfaces/billing.interface";

// Components
import { Receipt, DollarSign, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Hooks
import { useMyOutstandingBillings } from "@/hooks/use-my-outstanding-billings";
import { formatCurrency } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { AppCard } from "@/components/layout-ui/app-card";

const PAGINATION_LIMIT = 3;

/**
 * Card component that displays outstanding billings for the logged-in staff
 * Uses useMyOutstandingBillings hook directly - no props needed
 */
export function StaffOutstandingBillingsCard() {
  const componentId = useId();
  const { t } = useI18n();

  // Fetch outstanding billing summary using hook with pagination
  const { data, isLoading, pagination, setPage } = useMyOutstandingBillings(PAGINATION_LIMIT);

  const billings = data?.recentBillings || [];
  const totalOutstanding = data?.totalOutstanding || 0;
  const totalOutstandingCount = data?.totalOutstandingCount || 0;

  return (
    <div data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">{t("outstandingBillings") || "Outstanding Billings"}</h3>
          </div>
        }
        data-component-id={componentId}
        loading={isLoading}
      >
    
        <div className="space-y-4">
        {/* Summary Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">{t("totalOutstanding") || "Total Outstanding"}:</span>
            </div>
            <span className="text-xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</span>
          </div>
          {totalOutstandingCount > 0 && (
            <div className="flex items-center justify-end">
              <span className="text-xs text-muted-foreground">
                {totalOutstandingCount} {totalOutstandingCount === 1 ? t('billing') || 'billing' : t('billings') || 'billings'} {t('outstanding') || 'outstanding'}
              </span>
            </div>
          )}
        </div>

        {/* Billings List */}
        {billings.length > 0 ? (
          <>
            <div className="space-y-2">
              {billings.map((billing) => (
                <BillingItem key={billing.id} billing={billing} />
              ))}
            </div>
            {pagination.total > PAGINATION_LIMIT && (
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
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
          <div className="text-center py-6 text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noOutstandingBillings") || "No outstanding billings"}</p>
          </div>
        )}
      </div>
      </AppCard>
    </div>
  );
}

// BillingItem component
interface IBillingItemProps {
  billing: IBilling;
}

function BillingItem({ billing }: IBillingItemProps) {
  const componentId = useId();
  const { settings } = useUserSettings();

  const billingData = billing as any;
  const invoiceRef = billingData.invoiceRef || billing.id?.slice(0, 8);
  const amount = billingData.amount || 0;
  const title = billing.title || "";
  const type = billing.type;

  // Status badge configuration
  const getStatusVariant = () => {
    if (billing.status === 'PAID') return 'default';
    if (billing.status === 'PENDING') return 'secondary';
    if (billing.status === 'OVERDUE') return 'destructive';
    return 'outline';
  };

  const getStatusColor = () => {
    if (billing.status === 'PAID') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (billing.status === 'PENDING') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (billing.status === 'OVERDUE') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-component-id={componentId}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{title || invoiceRef}</p>
                {type && <p className="text-xs text-muted-foreground">{type}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-semibold text-sm">
                {formatCurrency(amount, undefined, undefined, 2, 2, settings)}
              </span>
              <Badge className={`text-xs ${getStatusColor()}`}>
                {billing.status}
              </Badge>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div><span className="font-semibold">Invoice:</span> {invoiceRef}</div>
            {title && <div><span className="font-semibold">Title:</span> {title}</div>}
            <div><span className="font-semibold">Amount:</span> {formatCurrency(amount, undefined, undefined, 2, 2, settings)}</div>
            <div><span className="font-semibold">Status:</span> {billing.status}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

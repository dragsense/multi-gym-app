// React
import { useId } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Star, Loader2 } from "lucide-react";

// Types
import type { IPaymentCard } from "@shared/interfaces/payment-processors.interface";

interface IDefaultCardDisplayProps {
  card: IPaymentCard | null;
  isLoading?: boolean;
  title?: string;
  emptyMessage?: string;
}

// Format card brand name
const formatBrandName = (brand: string): string => {
  const brandNames: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return brandNames[brand.toLowerCase()] || brand;
};

export function DefaultCardDisplay({
  card,
  isLoading = false,
  title = "Default Payment Method",
  emptyMessage = "No default payment method",
}: IDefaultCardDisplayProps) {
  const componentId = useId();

  if (isLoading) {
    return (
      <AppCard
        header={
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        }
        data-component-id={componentId}
      >
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard
      header={
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      }
      data-component-id={componentId}
    >
      {card ? (
        <div className="flex items-center justify-between p-4 rounded-lg border border-primary bg-primary/5">
          <div className="flex items-center gap-4">
            {/* Card Icon */}
            <div className="text-2xl">💳</div>

            {/* Card Details */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatBrandName(card.card?.brand || "Card")}
                </span>
                <span className="text-muted-foreground">
                  •••• {card.card?.last4}
                </span>
                <Badge variant="default" className="ml-2">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Expires {card.card?.exp_month}/{card.card?.exp_year}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <p>{emptyMessage}</p>
          <p className="text-xs mt-2">Payment methods will appear here once saved</p>
        </div>
      )}
    </AppCard>
  );
}

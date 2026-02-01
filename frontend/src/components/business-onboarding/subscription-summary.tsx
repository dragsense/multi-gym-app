// React
import { useMemo } from "react";

// Types
import type { ISubscription } from "@shared/interfaces";
import { ESubscriptionFrequency } from "@shared/enums";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Calendar, DollarSign, Receipt } from "lucide-react";

// Utils
import { formatCurrency } from "@/lib/utils";

interface ISubscriptionSummaryProps {
  subscription: ISubscription;
  frequency: ESubscriptionFrequency;
}

const getPrice = (monthlyPrice: number, frequency: ESubscriptionFrequency) => {
  switch (frequency) {
    case ESubscriptionFrequency.WEEKLY:
      return monthlyPrice / 4;
    case ESubscriptionFrequency.YEARLY:
      return monthlyPrice * 12;
    case ESubscriptionFrequency.MONTHLY:
    default:
      return monthlyPrice;
  }
};

const formatFrequency = (freq: ESubscriptionFrequency) => {
  switch (freq) {
    case ESubscriptionFrequency.WEEKLY:
      return "Week";
    case ESubscriptionFrequency.YEARLY:
      return "Year";
    case ESubscriptionFrequency.MONTHLY:
    default:
      return "Month";
  }
};

export function SubscriptionSummary({ subscription, frequency }: ISubscriptionSummaryProps) {
  const basePrice = Number(subscription.price) || 0;
  const discountPercentage = Number(subscription.discountPercentage) || 0;

  // Calculate price for selected frequency
  const frequencyPrice = useMemo(() => {
    return getPrice(basePrice, frequency);
  }, [basePrice, frequency]);

  // Calculate price after discount
  const priceAfterDiscount = useMemo(() => {
    if (frequencyPrice > 0 && discountPercentage > 0) {
      return frequencyPrice * (1 - discountPercentage / 100);
    }
    return frequencyPrice;
  }, [frequencyPrice, discountPercentage]);

  const discountAmount = frequencyPrice - priceAfterDiscount;
  const taxRate = 0; // Subscriptions might not have tax, but keeping structure consistent
  const taxAmount = priceAfterDiscount * (taxRate / 100);
  const totalAmount = priceAfterDiscount + taxAmount;

  return (
    <div className="rounded-lg overflow-hidden">
      <AppCard
        className="rounded-lg"
        header={
          <div className="p-1 -m-1 rounded-t-lg">
            <h3 className="text-lg font-semibold">
              Subscription Summary
            </h3>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Plan Name */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-semibold">{subscription.title}</span>
          </div>

          {/* Pricing Section */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            {frequencyPrice > 0 ? (
              <>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground line-through">
                      {formatCurrency(frequencyPrice)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-green-500">
                      {discountPercentage}% OFF
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(priceAfterDiscount)}
                  </span>
                </div>
                {discountPercentage > 0 && discountAmount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    You save {formatCurrency(discountAmount)}
                  </div>
                )}
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  per {formatFrequency(frequency)}
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold">Free</div>
            )}
          </div>

          {/* Tax Section */}
          {taxRate > 0 && (
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5" />
                  Tax ({taxRate}%):
                </span>
                <span className="font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
            </div>
          )}

          {/* Total Amount */}
          <div className="pt-3 border-t rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Amount:
              </span>
              <span className="text-xl font-bold">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  );
}

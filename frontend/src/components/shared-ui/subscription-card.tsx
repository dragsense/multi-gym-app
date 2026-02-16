// React
import { useId, useMemo } from "react";

// Types
import type { ISubscription } from "@shared/interfaces";
import { ESubscriptionFrequency } from "@shared/enums";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Check, Calendar, DollarSign } from "lucide-react";

// Utils
import { formatCurrency } from "@/lib/utils";

interface ISubscriptionCardProps {
  subscription: ISubscription;
  frequency: ESubscriptionFrequency;
  isSelected?: boolean;
  onClick?: () => void;
  showSelection?: boolean;
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

export function SubscriptionCard({
  subscription,
  frequency,
  isSelected = false,
  onClick,
  showSelection = true,
}: ISubscriptionCardProps) {
  const componentId = useId();
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

  // Use subscription color for styling
  const cardColor = useMemo(() => {
    if (subscription.color) {
      return subscription.color;
    }
    return undefined;
  }, [subscription.color]);

  const frequencyLabel = frequency === ESubscriptionFrequency.WEEKLY 
    ? 'week' 
    : frequency === ESubscriptionFrequency.YEARLY 
    ? 'year' 
    : 'month';

  return (
    <div
      className={`transition-all hover:shadow-lg rounded-lg overflow-hidden ${
        onClick ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "ring-2 ring-primary shadow-lg"
          : "hover:border-primary/50"
      }`}
    >
      {/* Top Colored Bar */}
      {cardColor && (
        <div
          className="h-2 w-full"
          style={{ backgroundColor: cardColor }}
        />
      )}
      <AppCard
        className="h-full rounded-lg"
        onClick={onClick}
        header={
          <div className="flex items-start justify-between p-1 -m-1 rounded-t-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {cardColor && (
                  <div
                    className="w-5 h-5 rounded-full shadow-sm border-2 border-white"
                    style={{ backgroundColor: cardColor }}
                  />
                )}
                <h3 className="text-xl font-semibold">
                  {subscription.title}
                </h3>
              </div>
              {subscription.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {subscription.description}
                </p>
              )}
            </div>
            {showSelection && isSelected && (
              <div className="ml-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-md bg-primary">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {/* Pricing Section */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              {frequencyPrice > 0 ? (
                <>
                  {discountPercentage > 0 && (
                    <div className="text-lg font-medium text-muted-foreground line-through">
                      {formatCurrency(frequencyPrice)}
                    </div>
                  )}
                  <div className="text-3xl font-bold">
                    {formatCurrency(priceAfterDiscount)}
                  </div>
                  {discountPercentage > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-green-500">
                      {discountPercentage}% OFF
                    </span>
                  )}
                </>
              ) : (
                <div className="text-3xl font-bold">Free</div>
              )}
            </div>
            {discountPercentage > 0 && discountAmount > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                You save {formatCurrency(discountAmount)}
              </div>
            )}
            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
              <Calendar className="h-3.5 w-3.5" />
              per {frequencyLabel}
            </div>
          </div>

          {/* Features */}
          {subscription.features && subscription.features.length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-primary" />
                What's Included:
              </div>
              <ul className="text-sm space-y-2.5">
                {subscription.features.slice(0, 5).map((feature: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 bg-muted/20 rounded-md p-2.5">
                    <Check
                      className="h-4 w-4 mt-0.5 flex-shrink-0 rounded-full text-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{typeof feature === 'string' ? feature : feature.name || feature}</div>
                      {feature.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
                {subscription.features.length > 5 && (
                  <li className="text-xs text-muted-foreground">
                    +{subscription.features.length - 5} more features
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </AppCard>
    </div>
  );
}

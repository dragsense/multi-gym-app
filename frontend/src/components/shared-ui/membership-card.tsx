// React
import { useId, useMemo } from "react";

// Types
import type { IMembership } from "@shared/interfaces";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Check, Clock, Calendar, Tag, DollarSign, AlertCircle, DoorOpen, MapPin } from "lucide-react";

// Utils
import { formatCurrency } from "@/lib/utils";

interface IMembershipCardProps {
  membership: IMembership;
  isSelected?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  showSelection?: boolean;
}

const formatBillingFrequency = (freq: string | undefined) => {
  if (!freq) return "";
  return freq.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatTimeRange = (accessHours: any[]) => {
  if (!accessHours || accessHours.length === 0) return null;
  const times = accessHours.map((hour: any) => {
    const start = hour.startTime || hour.start || "";
    const end = hour.endTime || hour.end || "";
    return start && end ? `${start} - ${end}` : null;
  }).filter(Boolean);
  return times.length > 0 ? times.join(", ") : null;
};

export function MembershipCard({
  membership,
  isSelected = false,
  isActive = false,
  onClick,
  showSelection = true,
}: IMembershipCardProps) {
  const componentId = useId();
  const basePrice = Number(membership.calculatedPrice) || 0;
  const signupFee = Number(membership.signupFee) || 0;
  const annualFee = Number(membership.annualFee) || 0;
  const cancellationFee = Number(membership.cancellationFee) || 0;
  const discountPercentage = Number(membership.discountPercentage) || 0;
  const pricePeriod = Number(membership.pricePeriod) || 1;

  // Calculate price after discount
  const priceAfterDiscount = useMemo(() => {
    if (basePrice > 0 && discountPercentage > 0) {
      return basePrice * (1 - discountPercentage / 100);
    }
    return basePrice;
  }, [basePrice, discountPercentage]);

  const totalPrice = priceAfterDiscount + signupFee;
  const discountAmount = basePrice - priceAfterDiscount;

  // Use membership color for styling
  const cardColor = useMemo(() => {
    if (membership.color) {
      return membership.color;
    }
    return undefined;
  }, [membership.color]);

  const borderColor = (isSelected || isActive) && cardColor ? cardColor : undefined;
  const accentColor = cardColor || undefined;

  return (
    <div
      className={`transition-all hover:shadow-lg rounded-lg overflow-hidden ${
        onClick ? "cursor-pointer" : ""
      } ${
        isSelected || isActive
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
                  {membership.title}
                </h3>
                {isActive && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-green-500">
                    Active
                  </span>
                )}
              </div>
              {membership.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {membership.description}
                </p>
              )}
            </div>
            {showSelection && (isSelected || isActive) && (
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
              {basePrice > 0 ? (
                <>
                  {discountPercentage > 0 && (
                    <div className="text-lg font-medium text-muted-foreground line-through">
                      {formatCurrency(basePrice)}
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
            {membership.billingFrequency && (
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                <Calendar className="h-3.5 w-3.5" />
                {formatBillingFrequency(membership.billingFrequency)}
                {pricePeriod > 1 && ` (${pricePeriod} months)`}
              </div>
            )}
          </div>

          {/* Fees Section */}
          {(!!signupFee || !!annualFee || !!cancellationFee) && (
            <div className="pt-3 border-t space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Additional Fees
              </div>
              {signupFee > 0 && (
                <div className="flex items-center justify-between text-sm bg-muted/20 rounded-md px-3 py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />
                    Signup Fee:
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(signupFee)}
                  </span>
                </div>
              )}
              {annualFee > 0 && (
                <div className="flex items-center justify-between text-sm bg-muted/20 rounded-md px-3 py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Annual Fee:
                  </span>
                  <span className="font-semibold">{formatCurrency(annualFee)}</span>
                </div>
              )}
              {cancellationFee > 0 && (
                <div className="flex items-center justify-between text-sm bg-muted/20 rounded-md px-3 py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Cancellation Fee:
                  </span>
                  <span className="font-semibold">{formatCurrency(cancellationFee)}</span>
                </div>
              )}
            </div>
          )}

          {/* Total Price */}
          {totalPrice > 0 && (
            <div
              className="pt-3 border-t rounded-lg p-3"
              style={{
                backgroundColor: accentColor ? `${accentColor}10` : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Amount:
                </span>
                <span className="text-xl font-bold">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          )}

          {/* Doors / Location access */}
          {(membership.doors === undefined || membership.doors === null || (Array.isArray(membership.doors) && membership.doors.length === 0)) ? (
            <div className="pt-3 border-t">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Access:
              </div>
              <div className="text-sm text-muted-foreground">All doors / all locations</div>
            </div>
          ) : membership.doors && membership.doors.length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Access:
              </div>
              <ul className="text-sm space-y-1.5">
                {membership.doors.map((door: any, idx: number) => (
                  <li key={door.id || idx} className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {door.name || door.id}
                    {door.location && (
                      <span className="text-xs">
                        ({typeof door.location === "object" ? (door.location.name || door.location.address) : door.location})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Access Hours */}
          {membership.accessHours && membership.accessHours.length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Access Hours:
              </div>
              <div className="text-sm font-medium rounded-md p-2.5">
                {formatTimeRange(membership.accessHours) || "24/7 Access"}
              </div>
            </div>
          )}

          {/* Access Features */}
          {membership.accessFeatures && membership.accessFeatures.length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-primary" />
                What's Included:
              </div>
              <ul className="text-sm space-y-2.5">
                {membership.accessFeatures.map((feature: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 bg-muted/20 rounded-md p-2.5">
                    <Check
                      className="h-4 w-4 mt-0.5 flex-shrink-0 rounded-full text-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{feature.name || feature}</div>
                      {feature.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment Preference */}
          {membership.paymentPreference && Array.isArray(membership.paymentPreference) && membership.paymentPreference.length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-xs text-muted-foreground bg-muted/20 rounded-md px-2 py-1.5 inline-block">
                Payment Methods: {membership.paymentPreference.map((p: string) => p.replace(/_/g, " ")).join(", ")}
              </div>
            </div>
          )}
        </div>
      </AppCard>
    </div>
  );
}


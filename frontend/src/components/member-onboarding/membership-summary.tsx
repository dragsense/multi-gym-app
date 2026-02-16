// React
import { useMemo, useRef, useEffect, useState } from "react";

// Types
import type { IMembership } from "@shared/interfaces";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Check, Clock, Calendar, Tag, DollarSign, AlertCircle, Receipt, FileText } from "lucide-react";

// Utils
import { formatCurrency, formatTimeString } from "@/lib/utils";

interface IMembershipSummaryProps {
  membership: IMembership;
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
    if (start && end) {
      const formattedStart = formatTimeString(start);
      const formattedEnd = formatTimeString(end);
      return `${formattedStart} - ${formattedEnd}`;
    }
    return null;
  }).filter(Boolean);
  return times.length > 0 ? times.join(", ") : null;
};

export function MembershipSummary({ membership }: IMembershipSummaryProps) {
  const basePrice = Number(membership.calculatedPrice) || 0;
  const signupFee = Number(membership.signupFee) || 0;
  const annualFee = Number(membership.annualFee) || 0;
  const cancellationFee = Number(membership.cancellationFee) || 0;
  const discountPercentage = Number(membership.discountPercentage) || 0;
  const pricePeriod = Number(membership.pricePeriod) || 1;
  
  const termsContainerRef = useRef<HTMLDivElement>(null);

  // Get tax from settings
  const taxRate = useMemo(() => {
    if (membership.settings && typeof membership.settings === 'object') {
      const settings = membership.settings as Record<string, any>;
      return Number(settings.taxRate) || Number(settings.tax) || 0;
    }
    return 0;
  }, [membership.settings]);

  // Calculate price after discount
  const priceAfterDiscount = useMemo(() => {
    if (basePrice > 0 && discountPercentage > 0) {
      return basePrice * (1 - discountPercentage / 100);
    }
    return basePrice;
  }, [basePrice, discountPercentage]);

  const subtotal = priceAfterDiscount + signupFee;
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;
  const discountAmount = basePrice - priceAfterDiscount;
  
  const hasTermsAndConditions = !!membership.termsAndConditions;


  return (
    <div className="rounded-lg overflow-hidden">
      {/* Top Colored Bar */}
    
      <AppCard
        className="rounded-lg"
        header={
          <div
            className="p-1 -m-1 rounded-t-lg"
            
          >
            <h3
              className="text-lg font-semibold"
            >
              Membership Summary
            </h3>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Plan Name */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-semibold">{membership.title}</span>
          </div>

          {/* Pricing Section */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            {basePrice > 0 ? (
              <>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground line-through">
                      {formatCurrency(basePrice)}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-green-500"
                    
                    >
                      {discountPercentage}% OFF
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">Price:</span>
                  <span
                    className="text-2xl font-bold"
                  >
                    {formatCurrency(priceAfterDiscount)}
                  </span>
                </div>
                {discountPercentage > 0 && discountAmount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    You save {formatCurrency(discountAmount)}
                  </div>
                )}
                {membership.billingFrequency && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    per {formatBillingFrequency(membership.billingFrequency)}
                    {pricePeriod > 1 && ` (${pricePeriod} months)`}
                  </div>
                )}
              </>
            ) : (
              <div className="text-2xl font-bold">Free</div>
            )}
          </div>

          {/* Fees Section */}
          {(!!signupFee || !!annualFee || !!cancellationFee) && (
            <div className="pt-2 border-t space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Additional Fees
              </div>
              {signupFee > 0 && (
                <div className="flex justify-between text-sm bg-muted/20 rounded-md px-3 py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />
                    Signup Fee:
                  </span>
                  <span className="font-semibold">{formatCurrency(signupFee)}</span>
                </div>
              )}
              {annualFee > 0 && (
                <div className="flex justify-between text-sm bg-muted/20 rounded-md px-3 py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Annual Fee:
                  </span>
                  <span className="font-semibold">{formatCurrency(annualFee)}</span>
                </div>
              )}
              {cancellationFee > 0 && (
                <div className="flex justify-between text-sm bg-muted/20 rounded-md px-3 py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Cancellation Fee:
                  </span>
                  <span className="font-semibold">{formatCurrency(cancellationFee)}</span>
                </div>
              )}
            </div>
          )}

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

          {/* Terms and Conditions Section */}
          {hasTermsAndConditions && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Terms and Conditions</h4>
              </div>
              <div
                ref={termsContainerRef}
                className="max-h-64 overflow-y-auto border rounded-lg p-4 bg-muted/20 text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: membership.termsAndConditions || "" }}
              />
          
            </div>
          )}
        </div>
      </AppCard>
    </div>
  );
}


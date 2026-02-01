// External Libraries
import React, { useId, useMemo, useTransition, useState, useEffect } from "react";
import { Check, Tag, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";

// Types
import type { IServiceOffer } from "@shared/interfaces/service-offer.interface";
import { useSearchableServiceOffers } from "@/hooks/use-searchable";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Utilities
interface IServiceOfferListSelectorProps {
  value?: IServiceOffer | null;
  onChange: (value: IServiceOffer | null) => void;
  disabled?: boolean;
}

export const ServiceOfferListSelector = React.memo(
  function ServiceOfferListSelector({
    value,
    onChange,
    disabled = false,
  }: IServiceOfferListSelectorProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState("");

    const {
      response,
      isLoading,
      setFilters,
    } = useSearchableServiceOffers({});

    const serviceOffers = response?.data || [];

    const selectedServiceOffer = useMemo(() => {
      if (!value) return null;
      return value;
    }, [value]);

    // Update filters when search query changes
    useEffect(() => {
      const timer = setTimeout(() => {
        if (searchQuery.trim()) {
          setFilters({ search: searchQuery });
        } else {
          setFilters({});
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [searchQuery, setFilters]);

    const handleSelect = (serviceOffer: IServiceOffer) => {
      if (disabled) return;
      startTransition(() => {
        // If already selected, deselect it; otherwise select it
        if (selectedServiceOffer?.id === serviceOffer.id) {
          onChange(null);
        } else {
          onChange({ id: serviceOffer.id, name: serviceOffer.name, offerPrice: serviceOffer.offerPrice, discount: serviceOffer.discount });
        }
      });
    };

    const handleClear = () => {
      if (disabled) return;
      startTransition(() => {
        onChange(null);
      });
    };

    const isSelected = (serviceOfferId: string) => {
      return selectedServiceOffer?.id === serviceOfferId;
    };

    const calculatePrice = () => {
      if (!selectedServiceOffer) return 0;
      const discountAmount = (Number(selectedServiceOffer.offerPrice) * (Number(selectedServiceOffer.discount) || 0)) / 100;
      return Number(selectedServiceOffer.offerPrice) - discountAmount;
    };

    return (
      <div className="space-y-4" data-component-id={componentId}>
        {/* Selected Service Offer Summary */}
        {selectedServiceOffer && (
          <AppCard className="bg-primary/5 border-primary/20">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="font-semibold">
                    {t('serviceOffer')} {t('selected')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {selectedServiceOffer.name}
                    {selectedServiceOffer.discount > 0 && (
                      <span className="text-xs">({selectedServiceOffer.discount}% off)</span>
                    )}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={handleClear}
                    />
                  </Badge>
                </div>
                <div className="mt-2 text-sm font-medium text-primary">
                  {t('price')}: ${calculatePrice().toFixed(2)}
                </div>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                >
                  {t('clear')}
                </Button>
              )}
            </div>
          </AppCard>
        )}

        {/* Search */}
        <div>
          <Input
            type="text"
            placeholder={t('search') + " " + t('serviceOffers').toLowerCase() + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled || isLoading}
          />
        </div>

        {/* Service Offers List */}
        <div className="space-y-2">
          {isLoading && serviceOffers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : serviceOffers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('no')} {t('serviceOffers').toLowerCase()} {t('found')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceOffers.map((serviceOffer) => {
                const offerSelected = isSelected(serviceOffer.id);
                const discountAmount = (Number(serviceOffer.offerPrice) * (Number(serviceOffer.discount) || 0)) / 100;
                const finalPrice = Number(serviceOffer.offerPrice) - discountAmount;

                return (
                  <div
                    key={serviceOffer.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      "p-4 rounded-lg border-2",
                      offerSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => handleSelect(serviceOffer)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <p className="font-semibold text-sm">
                            {serviceOffer.name}
                          </p>
                          {offerSelected && (
                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        {serviceOffer.trainerService && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {t('service')}: {serviceOffer.trainerService.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{t('price')}:</span>
                        <div className="flex items-center gap-2">
                          {serviceOffer.discount > 0 && (
                            <span className="text-xs line-through text-muted-foreground">
                              ${serviceOffer.offerPrice}
                            </span>
                          )}
                          <span className={cn(
                            "font-semibold",
                            serviceOffer.discount > 0 ? "text-primary" : ""
                          )}>
                            ${finalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {serviceOffer.discount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {serviceOffer.discount}% {t('discount')}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);


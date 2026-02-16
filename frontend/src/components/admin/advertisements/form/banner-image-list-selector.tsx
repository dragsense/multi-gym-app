// External Libraries
import React, { useId, useMemo, useTransition, useState, useEffect } from "react";
import { Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";

// Types
import type { IBannerImage } from "@shared/interfaces/advertisement.interface";
import { useSearchableBannerImages } from "@/hooks/use-searchable";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Utilities
interface IBannerImageListSelectorProps {
  value?: IBannerImage | null;
  onChange: (value: IBannerImage | null) => void;
  disabled?: boolean;
}

export const BannerImageListSelector = React.memo(
  function BannerImageListSelector({
    value,
    onChange,
    disabled = false,
  }: IBannerImageListSelectorProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState("");

    const {
      response,
      isLoading,
      setFilters,
    } = useSearchableBannerImages({});

    const bannerImages = response?.data || [];

    const selectedBannerImage = useMemo(() => {
      if (!value?.id) return null;
      return value || null;
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

    const handleSelect = (bannerImage: IBannerImage) => {
      if (disabled) return;
      startTransition(() => {
        if (value?.id === bannerImage.id) {
          onChange(null); // Deselect if already selected
        } else {
          onChange({
            id: bannerImage.id,
            name: bannerImage.name,
            image: bannerImage.image
          });
        }
      });
    };

    return (
      <div className="space-y-4" data-component-id={componentId}>
        {/* Selected Banner Preview */}
        {selectedBannerImage && (
          <AppCard className="bg-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {selectedBannerImage.image?.url ? (
                  <div className="w-32 h-20 rounded-lg overflow-hidden border-2 border-primary">
                    <img
                      src={selectedBannerImage.image.url}
                      alt={selectedBannerImage.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-20 rounded-lg bg-muted flex items-center justify-center border-2 border-primary">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{selectedBannerImage.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('selected')} {t('bannerImage').toLowerCase()}
                </p>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(null)}
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
            placeholder={t('search') + " " + t('bannerImages').toLowerCase() + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled || isLoading}
          />
        </div>

        {/* Banner Images List */}
        <div className="space-y-2">
          {isLoading && bannerImages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : bannerImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('no')} {t('bannerImages').toLowerCase()} {t('found')}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bannerImages.map((bannerImage) => {
                const isSelected = value?.id === bannerImage.id;
                return (
                  <div
                    key={bannerImage.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      "p-2 rounded-lg border-2",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => handleSelect(bannerImage)}
                  >
                    {bannerImage.image?.url ? (
                      <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden mb-2">
                        <img
                          src={bannerImage.image.url}
                          alt={bannerImage.name}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full aspect-[16/9] rounded-md bg-muted flex items-center justify-center mb-2">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium truncate">
                        {bannerImage.name}
                      </p>
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


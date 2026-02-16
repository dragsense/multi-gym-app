// React
import { useId, useState, useEffect, useCallback } from "react";

// Components
import { ExternalLink, Megaphone, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { IAdvertisement } from "@shared/interfaces/advertisement.interface";

interface IAdvertisementsBannerProps {
  advertisements: IAdvertisement[];
  isLoading?: boolean;
  autoSlideInterval?: number; // in milliseconds, default 5000
}

/**
 * UI Component for displaying advertisements banner as a slider
 * Features: auto-slide, left/right navigation, click to view full image
 */
export function AdvertisementsBanner({ 
  advertisements, 
  isLoading,
  autoSlideInterval = 5000,
}: IAdvertisementsBannerProps) {
  const { t } = useI18n();
  const componentId = useId();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<IAdvertisement | null>(null);

  const totalSlides = advertisements?.length || 0;

  const goToNext = useCallback(() => {
    if (totalSlides > 0) {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    if (totalSlides > 0) {
      setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  }, [totalSlides]);

  const handleSlideClick = useCallback((ad: IAdvertisement) => {
    setSelectedAd(ad);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAd(null);
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const interval = setInterval(goToNext, autoSlideInterval);
    return () => clearInterval(interval);
  }, [totalSlides, isPaused, autoSlideInterval, goToNext]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 md:h-70 w-full rounded-lg" />
      </div>
    );
  }

  if (!advertisements || advertisements.length === 0) {
    return null;
  }

  const currentAd = advertisements[currentIndex];

  return (
    <div data-component-id={componentId}>
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{buildSentence(t, 'promotions')}</h2>
      </div>
      
      {/* Slider Container */}
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Current Slide */}
        <AdvertisementSlide 
          advertisement={currentAd} 
          onClick={() => handleSlideClick(currentAd)}
        />

        {/* Navigation Buttons */}
        {totalSlides > 1 && (
          <>
            {/* Left Button */}
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-70 hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Right Button */}
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-70 hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {advertisements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-white w-4' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Full View Modal - Using AppDialog */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="min-w-5xl w-full p-6">
          {selectedAd && (
            <AppDialog
              title={selectedAd.title}
              footerContent={
                selectedAd.websiteLink ? (
                  <a
                    href={selectedAd.websiteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" />
                      {buildSentence(t, 'visit', 'website')}
                    </Button>
                  </a>
                ) : undefined
              }
            >
              {/* Full Image */}
              <div className="w-full flex items-center justify-center">
                {selectedAd.bannerImage?.image?.url ? (
                  <img
                    src={selectedAd.bannerImage.image.url}
                    alt={selectedAd.title}
                    className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="h-80 w-full bg-muted flex items-center justify-center rounded-lg">
                    <Megaphone className="h-24 w-24 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </AppDialog>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface IAdvertisementSlideProps {
  advertisement: IAdvertisement;
  onClick: () => void;
}

function AdvertisementSlide({ advertisement, onClick }: IAdvertisementSlideProps) {
  const imageUrl = advertisement.bannerImage?.image?.url;
  const hasLink = !!advertisement.websiteLink;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className="relative group overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md w-full cursor-pointer"
    >
      {/* Fixed Height Banner Image */}
      {imageUrl ? (
        <div className="h-48 md:h-70 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={advertisement.title}
            className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
            crossOrigin="anonymous"
          />
        </div>
      ) : (
        <div className="h-48 md:h-70 w-full bg-muted flex items-center justify-center">
          <Megaphone className="h-16 w-16 text-muted-foreground/50" />
        </div>
      )}

      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium md:text-lg truncate">{advertisement.title}</h3>
          {hasLink && (
            <ExternalLink className="h-5 w-5 text-white/80 flex-shrink-0 ml-2" />
          )}
        </div>
      </div>
    </div>
  );
}

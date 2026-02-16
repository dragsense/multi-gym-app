import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface StarRatingInputProps {
  value?: number;
  onChange: (value: number) => void;
  maxStars?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const StarRatingInput = React.memo(function StarRatingInput({
  value = 0,
  onChange,
  maxStars = 5,
  label,
  disabled = false,
  className,
}: StarRatingInputProps) {
  const handleStarClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleStarHover = (rating: number) => {
    // Optional: Add hover effect if needed
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      <div className="flex items-center gap-1">
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= (value || 0);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
              disabled={disabled}
              className={cn(
                "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-muted-foreground"
                )}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {value} / {maxStars}
          </span>
        )}
      </div>
    </div>
  );
});


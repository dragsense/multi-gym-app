import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAvailableSlots } from "@/hooks/use-session-availability";
import { formatTime, formatDateTime } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface SessionTimeSlotPickerProps {
  selectedDate: Date;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  trainerId?: string;
  memberIds?: string[];
}

export const SessionTimeSlotPicker = React.memo(function SessionTimeSlotPicker({
  selectedDate,
  value,
  onChange,
  disabled,
  trainerId,
  memberIds = [],
}: SessionTimeSlotPickerProps) {
  const { t } = useI18n();
  const { settings } = useUserSettings();

  const { data: slotsData, isLoading: isLoadingSlots } = useAvailableSlots({
    trainerId,
    memberIds,
    date: selectedDate.toISOString(),
    enabled: !!(trainerId && memberIds.length > 0 && selectedDate && !disabled),
  });

  const availableSlots = React.useMemo(
    () => slotsData?.slots || [],
    [slotsData]
  );
  const [selectedSlot, setSelectedSlot] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);

  // Sync selectedSlot with value
  useEffect(() => {
    if (value && availableSlots.length > 0) {
      const matchingSlot = availableSlots.find(
        (slot) => slot.startTime === value
      );
      if (matchingSlot) {
        setSelectedSlot(matchingSlot);
      }
    }
  }, [value, availableSlots]);

  // Handle slot selection
  const handleSlotSelect = (slot: { startTime: string; endTime: string }) => {
    setSelectedSlot(slot);
    if (onChange) {
      onChange(slot.startTime);
    }
  };

  return (
    <div className="space-y-4 min-h-[400px]">
      {isLoadingSlots && (
        <div className="space-y-2">
          <Label>{buildSentence(t, "available", "slots")}</Label>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-20">
            <Loader2 className="h-4 w-4 animate-spin" />
            {buildSentence(t, "loading", "slots")}...
          </div>
        </div>
      )}

      {!isLoadingSlots && availableSlots.length > 0 && (
        <div className="space-y-2">
          <Label>{buildSentence(t, "available", "slots")}</Label>
          <div className="grid grid-cols-2 gap-3 max-h-[330px] overflow-y-auto">
            {availableSlots.map((slot, index) => {
              const startTime = new Date(slot.startTime);
              const endTime = new Date(slot.endTime);

              const isSelected = selectedSlot?.startTime === slot.startTime;

              return (
                <Card
                  key={index}
                  className={`p-3 cursor-pointer transition-all hover:border-primary ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !disabled && handleSlotSelect(slot)}
                >
                  <div className="text-center font-medium text-sm">
                    {formatTime(startTime, settings)}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!isLoadingSlots && availableSlots.length === 0 && (
        <div className="space-y-2">
          <Label>{buildSentence(t, "available", "slots")}</Label>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {buildSentence(
                t,
                "no",
                "available",
                "slots",
                "for",
                "this",
                "date"
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {value && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <Label className="text-sm text-muted-foreground">
            {buildSentence(t, "selected", "date")}/{buildSentence(t,"time")}:
          </Label>
          <p className="font-medium mt-1">{formatDateTime(value, settings)}</p>
        </div>
      )}
    </div>
  );
});

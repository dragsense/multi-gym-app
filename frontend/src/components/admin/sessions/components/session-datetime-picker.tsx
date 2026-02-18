import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MiniCalendar } from "@/components/shared-ui/mini-calendar";
import { useAvailableDates } from "@/hooks/use-session-availability";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { SessionTimeSlotPicker } from "./session-time-slot-picker";
import type { TCustomInputWrapper } from "@/@types/form/field-config.type";
import type { TSessionData } from "@shared/types/session.type";
import type { MemberDto } from "@shared/dtos";

export const SessionDateTimePicker = React.memo(function SessionDateTimePicker(
  props: TCustomInputWrapper
) {
  const { value, onChange, disabled } = props;
  const { t } = useI18n();

  // Get form values using react-hook-form
  const { watch } = useFormContext<TSessionData>();
  const trainer = watch("trainer");
  const members = watch("members");

  console.log('trainer', trainer);

  const trainerId = trainer?.id;
  const memberIds = members?.map((c: MemberDto) => c.id) || [];

  // Initialize selectedDate from value if provided
  const getDateFromValue = (val: string | undefined): Date | undefined => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    getDateFromValue(value)
  );

  // Fetch available dates
  const { data: datesData, isLoading: isLoadingDates } = useAvailableDates({
    trainerId,
    memberIds,
    enabled: !!(trainerId && memberIds.length > 0 && !disabled),
  });

  const offDays = datesData?.offDays || [];
  const unavailableRanges = datesData?.unavailableRanges || [];

  // Handle date selection
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (!date && onChange) {
      onChange("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Mini Calendar */}
        <div className="space-y-4">
          <div>
            <Label>{buildSentence(t, "select", "date")}</Label>
            {isLoadingDates && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {buildSentence(t, "loading", "available", "dates")}...
              </div>
            )}
          </div>
          <div className="border rounded-md p-4 flex justify-center w-full">
            <MiniCalendar
              selected={selectedDate}
              onSelect={handleDateChange}
              offDays={offDays}
              unavailableRanges={unavailableRanges}
              disabled={disabled ? () => true : undefined}
            />
          </div>
        </div>

        {/* Right Column: Time Slots */}
        <div className="space-y-4">
          {selectedDate ? (
            <SessionTimeSlotPicker
              selectedDate={selectedDate}
              value={value}
              onChange={onChange}
              disabled={disabled}
              trainerId={trainerId}
              memberIds={memberIds}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {buildSentence(
                  t,
                  "please",
                  "select",
                  "a",
                  "date",
                  "to",
                  "view",
                  "available",
                  "slots"
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
});

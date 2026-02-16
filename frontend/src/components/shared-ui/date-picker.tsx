import * as React from "react";
import { DateTime } from "luxon";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// type from react-day-picker (used internally by shadcn Calendar)
import type { DateRange } from "react-day-picker";

type CalendarMode = "single" | "multiple" | "range";

interface DatePickerProps {
  value?: Date | DateRange;
  onSelect?: (date: Date | DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
  required?: boolean;
  showClear?: boolean;
  mode?: CalendarMode;
}

export function DatePicker({
  value,
  onSelect,
  placeholder = "Pick a date",
  className,
  disabled = false,
  fromDate,
  toDate,
  required = false,
  showClear = true,
  mode = "single",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<
    Date | DateRange | undefined
  >(value);

  const handleSelect = (date: Date | DateRange | undefined) => {
    setInternalValue(date);
    onSelect?.(date);

    // only auto-close popover in single mode
    if (mode === "single") {
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalValue(undefined);
    onSelect?.(undefined);
  };

  React.useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  const renderLabel = () => {
    if (!internalValue) return placeholder;

    if (mode === "range") {
      const { from, to } = internalValue as DateRange;
      if (from && to) {
        if (from.getTime() !== to.getTime()) {
          return `${DateTime.fromJSDate(from).toFormat(
            "DDD"
          )} - ${DateTime.fromJSDate(to).toFormat("DDD")}`;
        } else {
          return DateTime.fromJSDate(from).toFormat("DDD");
        }
      }
      if (from) {
        return DateTime.fromJSDate(from).toFormat("DDD");
      }
      return placeholder;
    }

    if (internalValue instanceof Date) {
      return DateTime.fromJSDate(internalValue).toFormat("DDD");
    }

    return placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            !internalValue && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {renderLabel()}
              {required && !internalValue && (
                <span className="ml-2 text-red-500">*</span>
              )}
            </div>
            {showClear && internalValue && (
              <div
                className="h-4 w-4 p-0 ml-2 rounded-full hover:bg-transparent"
                onClick={handleClear}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </div>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode={mode}
          selected={internalValue as any} // Calendar accepts Date | DateRange
          onSelect={handleSelect as any}
          required={required}
          disabled={(date) => {
            if (fromDate && date < fromDate) return true;
            if (toDate && date > toDate) return true;
            return false;
          }}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

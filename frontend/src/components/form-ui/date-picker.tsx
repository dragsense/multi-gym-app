/**
 * Date Picker Components for Form Integration
 *
 * These components work seamlessly with the backend CRUD service:
 *
 * Backend Integration:
 * - DateRangePicker: Returns [startDate, endDate] array for @Between decorator
 * - DateTimeRangePicker: Returns [startDateTime, endDateTime] array for @Between decorator
 *
 * Usage in DTOs:
 * ```typescript
 * // For date ranges
 * @FieldType("dateRange", true)
 * @Between()
 * dateRange: [Date, Date];
 *
 * // For date-time ranges
 * @FieldType("dateTimeRange", true)
 * @Between()
 * dateTimeRange: [Date, Date];
 * ```
 *
 * The CRUD service automatically converts these arrays to SQL BETWEEN queries:
 * - dateRange BETWEEN :param_start AND :param_end
 */

import React, { useState, useId, useMemo, useTransition } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";

interface DatePickerProps {
  value?: Date;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: "date" | "dateString";
}

export const DatePicker: React.FC<DatePickerProps> = React.memo(
  ({
    value,
    onChange,
    placeholder = "Select date",
    disabled = false,
    type = "date",
    className,
  }) => {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const [open, setOpen] = useState(false);

    // React 19: Memoized display value for better performance
    const displayValue = useMemo(
      () => (value ? new Date(value).toLocaleDateString() : placeholder),
      [value, placeholder]
    );

    // React 19: Smooth popover transitions
    const handleOpenChange = (newOpen: boolean) => {
      startTransition(() => {
        setOpen(newOpen);
      });
    };

    // React 19: Smooth date selection
    const handleDateSelect = (date: Date | undefined) => {
      startTransition(() => {
        let dateString = "";
        if (type === "date") {
          dateString = date ? new Date(date).toISOString() : "";
        } else {
          dateString = date ? new Date(date).toLocaleDateString() : "";
        }

        onChange(dateString);
        setOpen(false);
      });
    };

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-32 justify-between font-normal ${className}`}
            disabled={disabled}
            data-component-id={componentId}
          >
            {displayValue}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={handleDateSelect}
            fromYear={1925}
            toYear={new Date().getFullYear() + 10}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

DatePicker.displayName = "DatePicker";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = React.memo(
  ({
    value,
    onChange,
    placeholder = "Select date & time",
    disabled = false,
    className,
  }) => {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const [open, setOpen] = useState(false);

    // React 19: Memoized display value for better performance
    const displayValue = useMemo(
      () => (value ? new Date(value).toLocaleString() : placeholder),
      [value, placeholder]
    );

    // React 19: Memoized time value for better performance
    const timeValue = useMemo(
      () => (value ? new Date(value).toTimeString().slice(0, 5) : ""),
      [value]
    );

    // React 19: Smooth popover transitions
    const handleOpenChange = (newOpen: boolean) => {
      startTransition(() => {
        setOpen(newOpen);
      });
    };

    // React 19: Smooth date selection
    const handleDateSelect = (date: Date | undefined) => {
      startTransition(() => {
        if (date) {
          const current = new Date(value || new Date());
          date.setHours(current.getHours());
          date.setMinutes(current.getMinutes());
          const dateString = date.toISOString();
          onChange(dateString);
        }
      });
    };

    // React 19: Smooth time change
    const handleTimeChange = (timeString: string) => {
      startTransition(() => {
        const [hours, minutes] = timeString.split(":").map(Number);
        const date = value ? new Date(value) : new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        const dateString = date.toISOString();
        onChange(dateString);
      });
    };

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-auto justify-between font-normal ${className}`}
            disabled={disabled}
            data-component-id={componentId}
          >
            {displayValue}
            <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-4 space-y-2" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={value ? new Date(value) : undefined}
            onSelect={handleDateSelect}
            fromYear={1925}
            toYear={new Date().getFullYear() + 10}
          />

          <div className="flex items-center gap-2">
            <Label className="text-sm">Time:</Label>
            <Input
              type="time"
              className="border rounded px-2 py-1 text-sm"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

DateTimePicker.displayName = "DateTimePicker";

interface DateRangePickerProps {
  value?: DateRange | [Date, Date] | null;
  onChange: (
    dateRange: DateRange | [Date | null, Date | null] | undefined
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: "date" | "dateString";
}

interface DateRangePickerProps {
  value?:
    | DateRange
    | [Date, Date]
    | { startDate: string; endDate: string }
    | [string, string]
    | null;
  onChange: (
    dateRange:
      | DateRange
      | [Date | null, Date | null]
      | [string | null, string | null]
      | undefined
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: "date" | "dateString";
}

export const DateRangePicker: React.FC<DateRangePickerProps> = React.memo(
  ({
    value,
    onChange,
    placeholder = "Select date range",
    disabled = false,
    className,
    type = "date",
  }) => {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const [open, setOpen] = useState(false);

    // Convert value to DateRange format for internal use
    const dateRangeValue = useMemo((): DateRange | undefined => {
      if (!value) return undefined;

      if (Array.isArray(value)) {
        // Backend format: [startDate, endDate]
        if (type === "dateString") {
          // Handle string array [startDate, endDate] as YYYY-MM-DD
          let fromDate: Date | undefined;
          let toDate: Date | undefined;

          if (value[0] && typeof value[0] === "string") {
            const parts = value[0].split("-");
            if (parts.length === 3) {
              fromDate = new Date(
                parseInt(parts[0], 10),
                parseInt(parts[1], 10) - 1,
                parseInt(parts[2], 10)
              );
            }
          }
          if (value[1] && typeof value[1] === "string") {
            const parts = value[1].split("-");
            if (parts.length === 3) {
              toDate = new Date(
                parseInt(parts[0], 10),
                parseInt(parts[1], 10) - 1,
                parseInt(parts[2], 10)
              );
            }
          }
          return { from: fromDate, to: toDate };
        } else {
          // Handle Date array [Date, Date]
          const fromDate = value[0] instanceof Date ? value[0] : undefined;
          const toDate = value[1] instanceof Date ? value[1] : undefined;
          return { from: fromDate, to: toDate };
        }
      }

      if (
        typeof value === "object" &&
        "startDate" in value &&
        "endDate" in value
      ) {
        // Object format: { startDate: string, endDate: string }
        let fromDate: Date | undefined;
        let toDate: Date | undefined;

        if (value.startDate && typeof value.startDate === "string") {
          const parts = value.startDate.split("-");
          if (parts.length === 3) {
            fromDate = new Date(
              parseInt(parts[0], 10),
              parseInt(parts[1], 10) - 1,
              parseInt(parts[2], 10)
            );
          }
        }
        if (value.endDate && typeof value.endDate === "string") {
          const parts = value.endDate.split("-");
          if (parts.length === 3) {
            toDate = new Date(
              parseInt(parts[0], 10),
              parseInt(parts[1], 10) - 1,
              parseInt(parts[2], 10)
            );
          }
        }
        return { from: fromDate, to: toDate };
      }

      // Already DateRange format: { from: Date, to: Date }
      if (typeof value === "object" && "from" in value && "to" in value) {
        return value as DateRange;
      }

      return undefined;
    }, [value, type]);

    // React 19: Memoized display value for better performance
    const displayValue = useMemo(() => {
      if (!dateRangeValue?.from) return placeholder;

      const fromDate = new Date(dateRangeValue.from).toLocaleDateString();
      if (dateRangeValue.to) {
        const toDate = new Date(dateRangeValue.to).toLocaleDateString();
        return `${fromDate} - ${toDate}`;
      }
      return fromDate;
    }, [dateRangeValue, placeholder]);

    // React 19: Smooth popover transitions
    const handleOpenChange = (newOpen: boolean) => {
      startTransition(() => {
        setOpen(newOpen);
      });
    };

    // Internal state for temporary date selection
    const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(
      undefined
    );
    const [dateMode, setDateMode] = useState<"range" | "after" | "before">(
      "range"
    );

    // React 19: Smooth date range selection (temporary, not applied yet)
    const handleDateRangeSelect = (dateRange: DateRange | undefined) => {
      startTransition(() => {
        console.log("dateRange", dateRange);

        if (dateRange?.from && dateRange?.to) {
          // Both dates selected - check if they're the same
          if (dateRange.from.getTime() === dateRange.to.getTime()) {
            // Same date selected - only update from date (single date selection)
            setTempDateRange({ from: dateRange.from, to: undefined });
          } else {
            // Different dates - normal range selection
            setTempDateRange(dateRange);
          }
        } else if (dateRange?.from) {
          // Only from date selected
          setTempDateRange(dateRange);
        } else if (dateRange?.to) {
          // Only to date selected
          setTempDateRange(dateRange);
        } else {
          setTempDateRange(dateRange);
        }
      });
    };

    // Convert Date to YYYY-MM-DD string
    const formatDateToString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Apply the selected date range
    const handleApply = () => {
      startTransition(() => {
        if (tempDateRange?.from && tempDateRange?.to) {
          // Range mode - both dates selected
          if (type === "dateString") {
            const startDateStr = formatDateToString(tempDateRange.from);
            const endDateStr = formatDateToString(tempDateRange.to);
            const backendFormat: [string, string] = [startDateStr, endDateStr];
            onChange(backendFormat);
          } else {
            const endDate = new Date(tempDateRange.to);
            endDate.setHours(23, 59, 59, 999); // Set to end of day
            const backendFormat: [Date, Date] = [
              tempDateRange.from,
              tempDateRange.to,
            ];
            onChange(backendFormat);
          }
          setOpen(false);
        } else if (tempDateRange?.from) {
          // Single date selected - check mode
          if (type === "dateString") {
            if (dateMode === "after") {
              const startDateStr = formatDateToString(tempDateRange.from);
              const backendFormat: [string, null] = [startDateStr, null];
              onChange(backendFormat);
            } else if (dateMode === "before") {
              const endDateStr = formatDateToString(tempDateRange.from);
              const backendFormat: [null, string] = [null, endDateStr];
              onChange(backendFormat);
            } else {
              // Range mode - only from date
              const startDateStr = formatDateToString(tempDateRange.from);
              const backendFormat: [string, null] = [startDateStr, null];
              onChange(backendFormat);
            }
          } else {
            if (dateMode === "after") {
              const backendFormat: [Date, null] = [tempDateRange.from, null];
              onChange(backendFormat);
            } else if (dateMode === "before") {
              const endDate = new Date(tempDateRange.from);
              endDate.setHours(23, 59, 59, 999);
              const backendFormat: [null, Date] = [null, endDate];
              onChange(backendFormat);
            } else {
              // Range mode - only from date
              const backendFormat: [Date, null] = [tempDateRange.from, null];
              onChange(backendFormat);
            }
          }
          setOpen(false);
        } else if (tempDateRange?.to) {
          // Only to date selected
          if (type === "dateString") {
            const endDateStr = formatDateToString(tempDateRange.to);
            const backendFormat: [null, string] = [null, endDateStr];
            onChange(backendFormat);
          } else {
            const endDate = new Date(tempDateRange.to);
            endDate.setHours(23, 59, 59, 999);
            const backendFormat: [null, Date] = [null, endDate];
            onChange(backendFormat);
          }
          setOpen(false);
        } else {
          // No dates selected
          onChange(undefined);
          setOpen(false);
        }
      });
    };

    // Clear selection
    const handleClear = () => {
      startTransition(() => {
        setTempDateRange(undefined);
        setDateMode("range");
        onChange(undefined);
      });
    };

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-auto justify-between font-normal ${className}`}
            disabled={disabled}
            data-component-id={componentId}
          >
            {displayValue}
            <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={tempDateRange || dateRangeValue}
            captionLayout="dropdown"
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            fromYear={1925}
            toYear={new Date().getFullYear() + 10}
          />

          {/* Mode selection */}
          <div className="flex gap-1 p-2 border-t">
            <Button
              type="button"
              variant={dateMode === "range" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateMode("range")}
              className="text-xs flex-1"
            >
              Range
            </Button>
            <Button
              type="button"
              variant={dateMode === "after" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateMode("after")}
              className="text-xs flex-1"
            >
              After
            </Button>
            <Button
              type="button"
              variant={dateMode === "before" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateMode("before")}
              className="text-xs flex-1"
            >
              Before
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between p-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs"
            >
              Clear
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                className="text-xs"
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

DateRangePicker.displayName = "DateRangePicker";

interface DateTimeRangePickerProps {
  value?: { from: Date; to: Date } | [Date, Date] | null;
  onChange: (
    dateTimeRange:
      | { from: Date; to: Date }
      | [Date | null, Date | null]
      | undefined
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DateTimeRangePicker: React.FC<DateTimeRangePickerProps> =
  React.memo(
    ({
      value,
      onChange,
      placeholder = "Select date & time range",
      disabled = false,
      className,
    }) => {
      // React 19: Essential IDs and transitions
      const componentId = useId();
      const [, startTransition] = useTransition();

      const [open, setOpen] = useState(false);

      // Convert value to internal format for processing
      const dateTimeRangeValue = useMemo(():
        | { from: Date; to: Date }
        | undefined => {
        if (!value) return undefined;

        if (Array.isArray(value)) {
          // Backend format: [startDate, endDate]
          return { from: value[0], to: value[1] };
        }

        // Already object format: { from: Date, to: Date }
        return value;
      }, [value]);

      // React 19: Memoized display value for better performance
      const displayValue = useMemo(() => {
        if (!dateTimeRangeValue?.from) return placeholder;

        const fromDateTime = new Date(dateTimeRangeValue.from).toLocaleString();
        if (dateTimeRangeValue.to) {
          const toDateTime = new Date(dateTimeRangeValue.to).toLocaleString();
          return `${fromDateTime} - ${toDateTime}`;
        }
        return fromDateTime;
      }, [dateTimeRangeValue, placeholder]);

      // React 19: Smooth popover transitions
      const handleOpenChange = (newOpen: boolean) => {
        startTransition(() => {
          setOpen(newOpen);
        });
      };

      // Internal state for temporary date/time selection
      const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(
        undefined
      );
      const [tempFromTime, setTempFromTime] = useState<string>("");
      const [tempToTime, setTempToTime] = useState<string>("");
      const [dateMode, setDateMode] = useState<"range" | "after" | "before">(
        "range"
      );

      // React 19: Smooth date range selection (temporary, not applied yet)
      const handleDateRangeSelect = (dateRange: DateRange | undefined) => {
        startTransition(() => {
          if (dateRange?.from && dateRange?.to) {
            // Both dates selected - check if they're the same
            if (dateRange.from.getTime() === dateRange.to.getTime()) {
              // Same date selected - only update from date (single date selection)
              setTempDateRange({ from: dateRange.from, to: undefined });
            } else {
              // Different dates - normal range selection
              setTempDateRange(dateRange);
            }
          } else {
            setTempDateRange(dateRange);
          }
        });
      };

      // Apply the selected date range and times
      const handleApply = () => {
        startTransition(() => {
          if (tempDateRange?.from && tempDateRange?.to) {
            // Range mode - both dates selected
            const fromDate = new Date(tempDateRange.from);
            const toDate = new Date(tempDateRange.to);

            // Apply times if provided
            if (tempFromTime) {
              const [hours, minutes] = tempFromTime.split(":").map(Number);
              fromDate.setHours(hours);
              fromDate.setMinutes(minutes);
            }
            if (tempToTime) {
              const [hours, minutes] = tempToTime.split(":").map(Number);
              toDate.setHours(hours);
              toDate.setMinutes(minutes);
            }

            const backendFormat: [Date, Date] = [fromDate, toDate];
            onChange(backendFormat);
            setOpen(false);
          } else if (tempDateRange?.from) {
            // Single date selected - check mode
            const fromDate = new Date(tempDateRange.from);

            // Apply time if provided
            if (tempFromTime) {
              const [hours, minutes] = tempFromTime.split(":").map(Number);
              fromDate.setHours(hours);
              fromDate.setMinutes(minutes);
            }

            if (dateMode === "after") {
              const backendFormat: [Date, null] = [fromDate, null];
              onChange(backendFormat);
            } else if (dateMode === "before") {
              const toDate = new Date(tempDateRange.from);
              if (tempToTime) {
                const [hours, minutes] = tempToTime.split(":").map(Number);
                toDate.setHours(hours);
                toDate.setMinutes(minutes);
              } else {
                toDate.setHours(23, 59, 59, 999);
              }
              const backendFormat: [null, Date] = [null, toDate];
              onChange(backendFormat);
            } else {
              // Range mode - only from date
              const backendFormat: [Date, null] = [fromDate, null];
              onChange(backendFormat);
            }
            setOpen(false);
          } else if (tempDateRange?.to) {
            // Only to date selected
            const toDate = new Date(tempDateRange.to);

            // Apply time if provided
            if (tempToTime) {
              const [hours, minutes] = tempToTime.split(":").map(Number);
              toDate.setHours(hours);
              toDate.setMinutes(minutes);
            } else {
              toDate.setHours(23, 59, 59, 999);
            }

            const backendFormat: [null, Date] = [null, toDate];
            onChange(backendFormat);
            setOpen(false);
          } else {
            // No dates selected
            onChange(undefined);
            setOpen(false);
          }
        });
      };

      // Clear selection
      const handleClear = () => {
        startTransition(() => {
          setTempDateRange(undefined);
          setTempFromTime("");
          setTempToTime("");
          setDateMode("range");
          onChange(undefined);
          setOpen(false);
        });
      };

      // React 19: Smooth time change for from date (temporary)
      const handleFromTimeChange = (timeString: string) => {
        startTransition(() => {
          setTempFromTime(timeString);
        });
      };

      // React 19: Smooth time change for to date (temporary)
      const handleToTimeChange = (timeString: string) => {
        startTransition(() => {
          setTempToTime(timeString);
        });
      };

      // React 19: Memoized time values for better performance
      const fromTimeValue = useMemo(() => {
        if (tempFromTime) return tempFromTime;
        return dateTimeRangeValue?.from
          ? new Date(dateTimeRangeValue.from).toTimeString().slice(0, 5)
          : "";
      }, [tempFromTime, dateTimeRangeValue?.from]);

      const toTimeValue = useMemo(() => {
        if (tempToTime) return tempToTime;
        return dateTimeRangeValue?.to
          ? new Date(dateTimeRangeValue.to).toTimeString().slice(0, 5)
          : "";
      }, [tempToTime, dateTimeRangeValue?.to]);

      return (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-auto justify-between font-normal ${className}`}
              disabled={disabled}
              data-component-id={componentId}
            >
              {displayValue}
              <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 space-y-4" align="start">
            <Calendar
              mode="range"
              selected={tempDateRange || dateTimeRangeValue}
              captionLayout="dropdown"
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
              fromYear={1925}
              toYear={new Date().getFullYear() + 10}
            />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium w-16">From Time:</Label>
                <Input
                  type="time"
                  className="border rounded px-2 py-1 text-sm"
                  value={fromTimeValue}
                  onChange={(e) => handleFromTimeChange(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium w-16">To Time:</Label>
                <Input
                  type="time"
                  className="border rounded px-2 py-1 text-sm"
                  value={toTimeValue}
                  onChange={(e) => handleToTimeChange(e.target.value)}
                />
              </div>

              {/* Mode selection */}
              <div className="flex gap-1 pt-2">
                <Button
                  type="button"
                  variant={dateMode === "range" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateMode("range")}
                  className="text-xs flex-1"
                >
                  Range
                </Button>
                <Button
                  type="button"
                  variant={dateMode === "after" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateMode("after")}
                  className="text-xs flex-1"
                >
                  After
                </Button>
                <Button
                  type="button"
                  variant={dateMode === "before" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateMode("before")}
                  className="text-xs flex-1"
                >
                  Before
                </Button>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="text-xs"
                >
                  Clear
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApply}
                    className="text-xs"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }
  );

DateTimeRangePicker.displayName = "DateTimeRangePicker";

import { useState, useRef, useId, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppComboBoxProps<T> {
  value: T | T[];
  onChange: (value: T | T[]) => void;
  items: T[];
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  getLabel: (item: T) => string | null;
  getKey: (item: T) => string | null;
  getValue: (item: T) => T;
  onSearchChange: (search: string) => void;
  search: string;
  multiple?: boolean;
  searchType?: "local" | "api";
  disabled?: boolean;
  modal?: boolean;
  shouldFilter?: boolean;
}

export function AppComboBox<T>({
  value,
  onChange,
  items,
  loading,
  error,
  placeholder = "Select...",
  getLabel,
  getKey,
  search,
  onSearchChange,
  multiple = false,
  disabled,
  modal = false,
  getValue,
  shouldFilter = true,
}: AppComboBoxProps<T>) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [popoverWidth, setPopoverWidth] = useState<number | undefined>(
    undefined
  );

  // React 19: Smooth popover transitions
  const handleOpenChange = (nextOpen: boolean) => {
    startTransition(() => {
      setOpen(nextOpen);
      if (nextOpen && triggerRef.current) {
        setPopoverWidth(triggerRef.current.offsetWidth);
      }
    });
  };

  // React 19: Memoized selected values for better performance
  const selectedValues: T[] = useMemo(
    () => (multiple ? (Array.isArray(value) ? value : []) : []),
    [multiple, value]
  );

  const maxTags = 5;
  const extraCount = multiple ? selectedValues.length - maxTags : 0;

  // React 19: Smooth selection changes
  const handleSelectionChange = (item: T) => {
    startTransition(() => {
      if (multiple) {
        const itemValue = getValue(item);
        const isSelected = selectedValues.some((val) => {
          if (typeof val === "object" && typeof itemValue === "object") {
            return JSON.stringify(val) === JSON.stringify(itemValue);
          }
          return val === itemValue;
        });

        if (isSelected) {
          const filtered = selectedValues.filter((val) => {
            if (typeof val === "object" && typeof itemValue === "object") {
              return JSON.stringify(val) !== JSON.stringify(itemValue);
            }
            return val !== itemValue;
          });
          onChange(filtered as T[]);
        } else {
          onChange([...selectedValues, itemValue] as T[]);
        }
      } else {
        onChange(getValue(item));
        setOpen(false);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          className="w-full justify-between min-h-[40px] h-auto flex-nowrap overflow-hidden"
          disabled={disabled}
          style={{ textAlign: "left" }}
          data-component-id={componentId}
        >
          <span className="flex flex-wrap gap-1 items-center w-full">
            {multiple ? (
              <>
                {selectedValues.length === 0 && (
                  <span className="text-muted-foreground">
                    {getLabel(undefined as T) ?? placeholder}
                  </span>
                )}
                {selectedValues.slice(0, maxTags).map((item) => (
                  <Badge
                    key={getKey(item)}
                    variant="secondary"
                    className="truncate"
                    title={getLabel(item)}
                  >
                    {getLabel(item)}
                  </Badge>
                ))}
                {extraCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="truncate"
                    title={selectedValues
                      .slice(maxTags)
                      .map(getLabel)
                      .join(", ")}
                  >
                    +{extraCount} more
                  </Badge>
                )}
              </>
            ) : (
              <span
                className={cn(
                  "text-muted-foreground",
                  value ? "text-foreground" : ""
                )}
              >
                {getLabel(value as T) ?? placeholder}
              </span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={popoverWidth ? { width: popoverWidth } : {}}
        align="start"
      >
        <Command shouldFilter={shouldFilter}>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={onSearchChange}
            disabled={disabled}
          />

          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                Loading...
              </div>
            ) : error ? (
              <CommandEmpty className="py-6 text-center text-destructive">
                {error}
              </CommandEmpty>
            ) : items.length === 0 ? (
              <CommandEmpty>No results found</CommandEmpty>
            ) : (
              <div style={{ maxHeight: "300px", overflow: "auto" }}>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={getKey(item)}
                      onSelect={() => handleSelectionChange(item)}
                      className="cursor-pointer"
                    >
                      {multiple && (
                        <Checkbox
                          checked={selectedValues.some((val) => {
                            const itemValue = getValue(item);
                            if (
                              typeof val === "object" &&
                              typeof itemValue === "object"
                            ) {
                              return (
                                JSON.stringify(val) ===
                                JSON.stringify(itemValue)
                              );
                            }
                            return val === itemValue;
                          })}
                          className="pointer-events-none"
                        />
                      )}
                      <span className="ml-2">
                        {getLabel(item) ?? placeholder}
                      </span>
                      {!multiple && (
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            (() => {
                              const itemValue = getValue(item);
                              if (
                                typeof value === "object" &&
                                typeof itemValue === "object"
                              ) {
                                return (
                                  JSON.stringify(value) ===
                                  JSON.stringify(itemValue)
                                );
                              }

                              return value === itemValue;
                            })()
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

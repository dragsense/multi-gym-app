import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useId, useMemo, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

type OptionValue = string | number;

interface Option {
    value: OptionValue;
    label: string;
}

/** ---- Props: discriminated by `multiple` ---- */
type BaseProps = {
    options: Option[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    emptyText?: string;
    modal?: boolean;
    clearable?: boolean;
};

type MultiProps = BaseProps & {
    multiple: true;
    value: OptionValue[];
    onChange: (value: OptionValue[]) => void;
};

type SingleProps = BaseProps & {
    multiple?: false;
    value: OptionValue | undefined;
    onChange: (value: OptionValue | undefined) => void;
};

type AppSelectProps = MultiProps | SingleProps;

function toKey(v: OptionValue) {
    return String(v);
}

export function AppSelect({
    options,
    value,
    onChange,
    placeholder = "Select…",
    className,
    multiple = false,
    disabled = false,
    emptyText = "No options found.",
    modal = true,
    clearable = true,
}: AppSelectProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const [open, setOpen] = React.useState(false);

    if (!value) {
        value = multiple ? [] : undefined;
    }

    // Map value -> label (keys must be strings)
    const labelMap = React.useMemo(
        () =>
            Object.fromEntries(
                options.map((o) =>
                    typeof o === "object"
                        ? [toKey(o.value), o.label]
                        : [toKey(o), o]
                )
            ),
        [options]
    );

    const isSelected = React.useCallback(
        (val: OptionValue) =>
            multiple
                ? (value as OptionValue[])?.some((v) => toKey(v) === toKey(val)) ?? false
                : toKey(value as OptionValue | undefined ?? "") === toKey(val),
        [multiple, value]
    );

    // React 19: Smooth selection changes
    const toggle = (val: OptionValue) => {
        startTransition(() => {
            let next: any;
            if (multiple) {
                const list = (value as OptionValue[]) ?? [];
                const exists = list.some((v) => toKey(v) === toKey(val));
                next = exists ? list.filter((v) => toKey(v) !== toKey(val)) : [...list, val];
            } else {
                const current = value as OptionValue | undefined;
                next = current !== undefined && toKey(current) === toKey(val) ? undefined : val;
                setOpen(false);
            }

            onChange(next);
        });
    };

    // React 19: Smooth clear operations
    const clearAll = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation?.();
        startTransition(() => {
            (onChange as (v: OptionValue[] | OptionValue | undefined) => void)(undefined);
        });
    };

    const hasSelection = multiple
        ? (value as OptionValue[])?.length > 0
        : value !== undefined && value !== null && value !== "";

    return (
        <Popover data-component-id={componentId} open={open} onOpenChange={setOpen} modal={modal}>
            <PopoverTrigger asChild>
                <Button
                    disabled={disabled}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full px-2 h-auto",
                        "justify-between items-start",
                        "text-left whitespace-normal",
                        "flex flex-wrap gap-1",
                        className
                    )}
                >
                    <div className="flex flex-1 items-center gap-1 flex-wrap">
                        {!hasSelection && (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}

                        {multiple ? (
                            (value as OptionValue[])?.map((v) => {
                                const key = toKey(v);
                                return (
                                    <Badge
                                        key={key}
                                        variant="secondary"
                                        className="mr-1 mb-1 flex items-center gap-1"
                                    >
                                        {labelMap[key] ?? key}

                                    </Badge>
                                );
                            }) ?? []
                        ) : (
                            hasSelection && (
                                <span>{labelMap[toKey(value as OptionValue)] ?? toKey(value as OptionValue)}</span>
                            )
                        )}
                    </div>

                    <div className="flex items-center gap-0 ml-auto">
                        {hasSelection && clearable && (
                            <div onClick={clearAll}>
                                <X
                                    className="h-4 w-4 shrink-0 opacity-60 hover:opacity-100"
                                />
                            </div>
                        )}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                {/* Use built-in cmdk filtering by providing item values */}
                <Command>
                    <CommandInput placeholder="Search…" />
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup className="w-100 max-h-60 overflow-y-auto">
                        {options.map((option) => {
                            const selected = isSelected(option.value);
                            return (
                                <CommandItem
                                    key={toKey(option.value)}
                                    value={`${toKey(option.value)}`}
                                    onSelect={() => toggle(option.value)}
                                    aria-selected={selected}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

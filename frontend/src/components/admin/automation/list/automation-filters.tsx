// React & Hooks
import { useId, useMemo, useTransition } from "react";

// External libraries
import { XIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Types
import { type IAutomation } from "@shared/interfaces/automation.interface";
import { type TListHandlerStore } from "@/stores/list/list-handler-store";
import type { TAutomationListData } from "@shared/types/automation.type";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { EAutomationTrigger, EAutomationStatus, EAutomationFormat } from "@shared/enums";

interface IAutomationFiltersProps {
    store: TListHandlerStore<IAutomation, TAutomationListData, any>;
}

export function AutomationFilters({
    store,
}: IAutomationFiltersProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    const filters = store(state => state.filters);
    const setFilters = store.getState().setFilters;

    // React 19: Memoized active filters check for better performance
    const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

    const handleTriggerChange = (value: string) => {
        startTransition(() => {
            if (value === "all") {
                const { trigger, ...rest } = filters;
                setFilters(rest);
            } else {
                setFilters({ ...filters, trigger: value });
            }
        });
    };

    const handleStatusChange = (value: string) => {
        startTransition(() => {
            if (value === "all") {
                const { status, ...rest } = filters;
                setFilters(rest);
            } else {
                setFilters({ ...filters, status: value });
            }
        });
    };

    const handleFormatChange = (value: string) => {
        startTransition(() => {
            if (value === "all") {
                const { format, ...rest } = filters;
                setFilters(rest);
            } else {
                setFilters({ ...filters, format: value });
            }
        });
    };

    const handleClearFilters = () => {
        startTransition(() => setFilters({}));
    };

    return (
        <div className="flex-1 flex items-center gap-2 flex-wrap" data-component-id={componentId}>
            {/* Trigger Filter */}
            <Select
                value={(filters as any).trigger || "all"}
                onValueChange={handleTriggerChange}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={buildSentence(t, "all")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{buildSentence(t, "all")}</SelectItem>
                    <SelectItem value={EAutomationTrigger.ONBOARD}>{buildSentence(t, "onboard")}</SelectItem>
                    <SelectItem value={EAutomationTrigger.BILLING}>{buildSentence(t, "billing")}</SelectItem>
                    <SelectItem value={EAutomationTrigger.CHECKIN}>{buildSentence(t, "check-in")}</SelectItem>
                    <SelectItem value={EAutomationTrigger.CHECKOUT}>{buildSentence(t, "check-out")}</SelectItem>
                    <SelectItem value={EAutomationTrigger.MEMBERSHIP_RENEWAL}>{buildSentence(t, "membership", "renewal")}</SelectItem>
                </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
                value={(filters as any).status || "all"}
                onValueChange={handleStatusChange}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={buildSentence(t, "all")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{buildSentence(t, "all")}</SelectItem>
                    <SelectItem value={EAutomationStatus.ACTIVE}>{buildSentence(t, "active")}</SelectItem>
                    <SelectItem value={EAutomationStatus.INACTIVE}>{buildSentence(t, "inactive")}</SelectItem>
                </SelectContent>
            </Select>

            {/* Format Filter */}
            <Select
                value={(filters as any).format || "all"}
                onValueChange={handleFormatChange}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={buildSentence(t, "all")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{buildSentence(t, "all")}</SelectItem>
                    <SelectItem value={EAutomationFormat.EMAIL}>{buildSentence(t, "email")}</SelectItem>
                </SelectContent>
            </Select>

            {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
                    <XIcon className="h-4 w-4 mr-2" />
                    {buildSentence(t, 'clear', 'filters')}
                </Button>
            )}
        </div>
    );
}

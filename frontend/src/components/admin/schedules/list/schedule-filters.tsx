// React & Hooks
import { useId, useMemo, useTransition } from "react";
import { XIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { type ISchedule } from "@shared/interfaces/schedule.interface";
import { type TListHandlerStore } from "@/stores/list/list-handler-store";
import { useInput } from "@/hooks/use-input";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import type { ScheduleListDto } from "@shared/dtos/schedule-dtos/schedule.dto";

interface IScheduleFiltersProps {
  store: TListHandlerStore<ISchedule, any, any>;
}

export function ScheduleFilters({ store }: IScheduleFiltersProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const filteredFields = store.getState().filteredFields;
  const filters = store((state) => state.filters);
  const setFilters = store.getState().setFilters;

  const inputs = useInput<ScheduleListDto>({
    fields: filteredFields as TFieldConfigObject<ScheduleListDto>,
  });

  // React 19: Memoized active filters check for better performance
  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="flex-1 flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search as React.ReactNode}
      {inputs.status as React.ReactNode}
      {inputs.frequency as React.ReactNode}
      {inputs.createdAfter as React.ReactNode}
      {inputs.createdBefore as React.ReactNode}

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={handleClearFilters}
          className="hidden lg:flex"
        >
          <XIcon className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}


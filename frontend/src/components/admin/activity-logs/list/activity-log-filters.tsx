// React & Hooks
import { useEffect, useState, useId, useMemo, useTransition } from "react";

// External libraries
import { Filter, XIcon } from "lucide-react";
  
// UI Components
import { Button } from "@/components/ui/button";
 

// Custom UI Components

import { type IActivityLog } from "@shared/interfaces/activity-log.interface";
import { type TListHandlerStore } from "@/stores/list/list-handler-store";
import { useInput } from "@/hooks/use-input";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import type { TActivityLogListData } from "@shared/types";

interface IActivityLogFiltersProps {
  store: TListHandlerStore<IActivityLog, TActivityLogListData, any>;
}

export function ActivityLogFilters({
  store,
}: IActivityLogFiltersProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const filteredFields = store.getState().filteredFields;
  const filters = store(state => state.filters);
  const setFilters = store.getState().setFilters;

  const inputs = useInput<TActivityLogListData>({
    fields: filteredFields as TFieldConfigObject<TActivityLogListData>,
  });

  // React 19: Memoized active filters check for better performance
  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="flex-1 flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search}
      {inputs.createdAfter}
      {inputs.createdBefore}
      {inputs.type}

      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
          <XIcon className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
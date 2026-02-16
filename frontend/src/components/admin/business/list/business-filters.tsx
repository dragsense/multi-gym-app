// React & Hooks
import { useId, useMemo, useTransition } from "react";

// External libraries
import { XIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Types
import { type IBusiness } from "@shared/interfaces";
import { type TListHandlerStore } from "@/stores/list/list-handler-store";
import { useInput } from "@/hooks/use-input";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import type { TBusinessListData } from "@shared/types";

interface IBusinessFiltersProps {
  store: TListHandlerStore<IBusiness, TBusinessListData, any>;
}

export function BusinessFilters({
  store,
}: IBusinessFiltersProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();

  const filteredFields = store.getState().filteredFields;
  const filters = store(state => state.filters);
  const setFilters = store.getState().setFilters;

  const fields = useMemo(() => ({
    ...filteredFields,
    search: {
      ...filteredFields.search,
      placeholder: 'Search by name or subdomain',
    },
    status: {
      ...filteredFields.status,
      placeholder: 'Select status',
    },
  } as TFieldConfigObject<TBusinessListData>), [filteredFields]);

  const inputs = useInput<TBusinessListData>({
    fields: fields as TFieldConfigObject<TBusinessListData>,
  });

  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="flex-1 flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search}
      <div className="min-w-xs">
        {inputs.status}
      </div>
      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
          <XIcon className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

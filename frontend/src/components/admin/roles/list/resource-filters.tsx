// External Libraries
import { useId, useMemo, useTransition } from "react";

// Types
import type { TListHandlerStore } from "@/stores";
import type { IResource } from '@shared/interfaces';
import type { TFieldConfigObject } from '@/@types/form/field-config.type';

// Components
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

// Hooks
import { useInput } from "@/hooks/use-input";
import type { TResourceListData } from "@shared/types";


interface IResourceFiltersProps {
  store: TListHandlerStore<IResource, TResourceListData, any>;
}

export function ResourceFilters({ store }: IResourceFiltersProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const filteredFields = store.getState().filteredFields;
  const filters = store((state) => state.filters);
  const setFilters = store.getState().setFilters;

  const inputs = useInput<TResourceListData>({
    fields: filteredFields as TFieldConfigObject<TResourceListData>,
  });

  // React 19: Memoized active filters check for better performance
  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="flex-1 flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search}

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

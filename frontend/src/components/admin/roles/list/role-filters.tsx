// External Libraries
import { useId, useMemo, useTransition } from "react";

// Types
import type { TListHandlerStore } from "@/stores";
import type { IRole } from '@shared/interfaces';
import type { TFieldConfigObject } from '@/@types/form/field-config.type';
import type { TRoleListData } from "@shared/types";

// Components
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

// Hooks
import { useInput } from "@/hooks/use-input";

interface IRoleFiltersProps {
  store: TListHandlerStore<IRole, any, any>;
}

export function RoleFilters({ store }: IRoleFiltersProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const filteredFields = store.getState().filteredFields;
  const filters = store((state) => state.filters);
  const setFilters = store.getState().setFilters;

  const inputs = useInput<TRoleListData>({
    fields: filteredFields as TFieldConfigObject<TRoleListData>,
  });

  // React 19: Memoized active filters check for better performance
  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="flex-1 flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search}
      {inputs.isSystem}

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

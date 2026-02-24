// React & Hooks
import { useId, useMemo, useTransition } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { XIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Types
import { type IStaff } from "@shared/interfaces/staff.interface";
import { type TListHandlerStore } from "@/stores/list/list-handler-store";
import { useInput } from "@/hooks/use-input";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import type { StaffListDto } from "@shared/dtos";

interface IStaffFiltersProps {
  store: TListHandlerStore<IStaff, StaffListDto, any>;
}

export function StaffFilters({
  store,
}: IStaffFiltersProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const filteredFields = store.getState().filteredFields;
  const filters = store(state => state.filters);
  const setFilters = store.getState().setFilters;
  const { t } = useI18n();

  const inputs = useInput<StaffListDto>({
    fields: {
      ...filteredFields,
      search: {
        ...(filteredFields.search as any),
        placeholder: buildSentence(t, 'search', 'staff'),
      }
    } as TFieldConfigObject<StaffListDto>,
  });

  // React 19: Memoized active filters check for better performance
  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="flex-1 flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search}
      {inputs.createdAt}

      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
          <XIcon className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

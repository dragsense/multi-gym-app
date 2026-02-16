// React & Hooks
import { useId, useMemo, useTransition } from "react";

// External libraries
import { XIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { type IEquipment } from "@shared/interfaces/equipment-reservation.interface";
import { type TListHandlerStore } from "@/stores/list/list-handler-store";
import { useInput } from "@/hooks/use-input";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import type { TEquipmentListData } from "@shared/types/equipment-reservation.type";
// Language Translator
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IEquipmentFiltersProps {
  store: TListHandlerStore<IEquipment, TEquipmentListData, any>;
}

export function EquipmentFilters({
  store,
}: IEquipmentFiltersProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const filteredFields = store.getState().filteredFields;
  const filters = store(state => state.filters);
  const { t } = useI18n();
  
  const setFilters = store.getState().setFilters;
  
  const fields = useMemo(() => ({
    ...filteredFields,
    search: {
      ...filteredFields.search,
      placeholder: buildSentence(t, "search", 'by', 'name')
    },
  }), [filteredFields, t]);

  const inputs = useInput<TEquipmentListData>({
    fields: fields as TFieldConfigObject<TEquipmentListData>,
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
        <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
          <XIcon className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

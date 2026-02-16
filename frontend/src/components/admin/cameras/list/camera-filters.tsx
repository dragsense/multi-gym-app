// React & Hooks
import { useId, useMemo, useTransition } from "react";

// External libraries
import { XIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { type ICamera } from "@shared/interfaces/camera.interface";
import { type TListHandlerStore } from "@/stores/list/list-handler-store";
import { useInput } from "@/hooks/use-input";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import type { TCameraListData } from "@shared/types/camera.type";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface ICameraFiltersProps {
  store: TListHandlerStore<ICamera, TCameraListData, any>;
}

export function CameraFilters({
  store,
}: ICameraFiltersProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const filteredFields = store.getState().filteredFields;
  const filters = store(state => state.filters);
  const setFilters = store.getState().setFilters;
  
  const fields = useMemo(() => ({
    ...filteredFields,
    search: {
      ...filteredFields.search,
      placeholder: buildSentence(t, "search", "by", "camera", "name")
    }
  }), [filteredFields, t]);
  
  const inputs = useInput<TCameraListData>({
    fields: fields as TFieldConfigObject<TCameraListData>,
  });

  // React 19: Memoized active filters check for better performance
  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="flex-1 flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search}
      {inputs.isActive && (
        <div className="min-w-xs">
          {inputs.isActive}
        </div>
      )}
      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
          <XIcon className="h-4 w-4 mr-2" />
          {buildSentence(t, 'clear', 'filters')}
        </Button>
      )}
    </div>
  );
}

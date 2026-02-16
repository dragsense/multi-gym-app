// React & Hooks
import { useEffect, useState, useId, useMemo, useTransition } from "react";

// External libraries
import { Filter, XIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

//Langauge Translator
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Custom UI Components
import { DatePicker } from "@/components/shared-ui/date-picker";
import { type DateRange } from "react-day-picker";
import { type IMember } from "@shared/interfaces/member.interface";
import { type TListHandlerStore } from "@/stores/list/list-handler-store";
import { useInput } from "@/hooks/use-input";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import type { TMemberListData } from "@shared/types/member.type";

interface IMemberFiltersProps {
  store: TListHandlerStore<IMember, TMemberListData, any>;
}

export function MemberFilters({
  store,
}: IMemberFiltersProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const filteredFields = store.getState().filteredFields;
  const filters = store(state => state.filters);
  const setFilters = store.getState().setFilters;
  const fields=useMemo(() => ({
    ...filteredFields,
      search: {
    ...filteredFields.search,
    placeholder: buildSentence(t,"Search",'by','title')
  },
    createdAt:{
      ...filteredFields.createdAt,
      label:buildSentence(t,"Created",'At')
    }
}), [filteredFields]
)

  const inputs = useInput<TMemberListData>({
    fields: fields as TFieldConfigObject<TMemberListData>,
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
      {inputs.createdAfter}
      {inputs.createdBefore}

      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
          <XIcon className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

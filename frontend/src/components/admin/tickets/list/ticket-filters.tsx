// React & Hooks
import { useId, useMemo, useTransition } from "react";

// External libraries
import { XIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Types
import { type ITicket } from "@shared/interfaces/ticket.interface";
import { type TListHandlerStore } from "@/stores/list/list-handler-store";
import { useInput } from "@/hooks/use-input";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import type { TicketListDto } from "@shared/dtos";
import type { TTicketListData } from "@shared/types";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface ITicketFiltersProps {
  store: TListHandlerStore<ITicket, TicketListDto, any>;
}

export function TicketFilters({ store }: ITicketFiltersProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const { t } = useI18n();

  const filteredFields = store.getState().filteredFields;
  const filters = store((state) => state.filters);
  const setFilters = store.getState().setFilters;

  // React 19: Memoized fields for better performance
  const fields = useMemo(
    () =>
      ({
        ...filteredFields,
        search: {
          ...filteredFields.search,
          placeholder: buildSentence(t, "searchByTicket"),
        },
        status: {
          ...filteredFields.status,
          placeholder: buildSentence(t, "selectStatus"),
        },
        priority: {
          ...filteredFields.priority,
          placeholder: buildSentence(t, "selectPriority"),
        },
        createdAt: {
          ...filteredFields.createdAt,
          label: buildSentence(t, "createdAt"),
        },
      }) as TFieldConfigObject<TTicketListData>,
    [filteredFields, t],
  );

  const inputs = useInput<TTicketListData>({
    fields: fields as TFieldConfigObject<TTicketListData>,
  });

  // React 19: Memoized active filters check for better performance
  const hasActiveFilters = useMemo(
    () => Object.keys(filters).length > 0,
    [filters],
  );

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div
      className="flex-1 flex items-end gap-2 flex-wrap"
      data-component-id={componentId}
    >
      {inputs.search}
      {inputs.status}
      {inputs.priority}
      {inputs.assignedToUserId}
      {inputs.createdByUserId}
      {inputs.createdAtRange || inputs.createdAt}

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

import { useId, useMemo, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { TListHandlerStore } from "@/stores";
import type { IOrder } from "@shared/interfaces/order.interface";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { OrderListDto } from "@shared/dtos";

interface IOrderFiltersProps {
  store: TListHandlerStore<IOrder, OrderListDto, Record<string, unknown>>;
}

export function OrderFilters({ store }: IOrderFiltersProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  
  const filteredFields = store.getState().filteredFields;
  const filters = store((s) => s.filters);
  const setFilters = store.getState().setFilters;

  const fields = useMemo(
    () => ({
      ...filteredFields,
      search: {
        ...(filteredFields as TFieldConfigObject<OrderListDto>).search,
        placeholder: t("searchOrders") || "Search orders...",
      },
    }),
    [filteredFields, t]
  );

  const inputs = useInput<OrderListDto>({
    fields: fields as TFieldConfigObject<OrderListDto>,
  });

  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="flex-1 flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search}
      {inputs.status}
      {inputs.createdAt}

      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
          <XIcon className="h-4 w-4 mr-2" />
          {buildSentence(t, "clear", "filters")}
        </Button>
      )}
    </div>
  );
}

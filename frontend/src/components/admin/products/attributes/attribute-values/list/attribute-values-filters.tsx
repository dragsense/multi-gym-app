import { useId, useMemo, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInput } from "@/hooks/use-input";
import type { TListHandlerStore } from "@/stores";
import type { IAttributeValue } from "@shared/interfaces/products/attribute-value.interface";
import type { TAttributeValueListData } from "@shared/types/products/attribute-value.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { AttributeValueListDto } from "@shared/dtos";

interface IAttributeValuesFiltersProps {
  store: TListHandlerStore<IAttributeValue, TAttributeValueListData, any>;
}

export function AttributeValuesFilters({ store }: IAttributeValuesFiltersProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const filteredFields = store.getState().filteredFields;
  const filters = store((s) => s.filters);
  const setFilters = store.getState().setFilters;

  const fields = useMemo(
    () => ({
      ...filteredFields,
      search: {
        ...(filteredFields as TFieldConfigObject<AttributeValueListDto>).search,
        placeholder: "Search by value",
      },
    }),
    [filteredFields]
  );

  const inputs = useInput<AttributeValueListDto>({
    fields: fields as TFieldConfigObject<AttributeValueListDto>,
  });
  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => startTransition(() => setFilters({}));

  return (
    <div className="flex-1 flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search}
      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
          <XIcon className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}

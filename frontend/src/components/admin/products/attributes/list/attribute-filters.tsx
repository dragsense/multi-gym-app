import { useId, useMemo, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInput } from "@/hooks/use-input";
import type { TListHandlerStore } from "@/stores";
import type { IAttribute } from "@shared/interfaces/products/attribute.interface";
import type { TAttributeListData } from "@shared/types/products/attribute.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { AttributeListDto } from "@shared/dtos";

interface IAttributeFiltersProps {
  store: TListHandlerStore<IAttribute, TAttributeListData, any>;
}

export function AttributeFilters({ store }: IAttributeFiltersProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const filteredFields = store.getState().filteredFields;
  const filters = store((s) => s.filters);
  const setFilters = store.getState().setFilters;

  const fields = useMemo(
    () => ({
      ...filteredFields,
      search: {
        ...(filteredFields as TFieldConfigObject<AttributeListDto>).search,
        placeholder: "Search by name",
      },
    }),
    [filteredFields]
  );

  const inputs = useInput<AttributeListDto>({
    fields: fields as TFieldConfigObject<AttributeListDto>,
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

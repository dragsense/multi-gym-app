import { useId, useMemo, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import type { TListHandlerStore } from "@/stores";
import type { IProductType } from "@shared/interfaces/products/product-type.interface";
import type { TProductTypeListData } from "@shared/types/products/product-type.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { ProductTypeListDto } from "@shared/dtos";

interface IProductTypesFiltersProps {
  store: TListHandlerStore<IProductType, TProductTypeListData, any>;
}

export function ProductTypesFilters({ store }: IProductTypesFiltersProps) {
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
        ...(filteredFields as TFieldConfigObject<ProductTypeListDto>).search,
        placeholder: t("search") + " " + (t("productTypes") || "product types"),
      },
    }),
    [filteredFields, t]
  );

  const inputs = useInput<ProductTypeListDto>({
    fields: fields as TFieldConfigObject<ProductTypeListDto>,
  });

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
          {t("clear")}
        </Button>
      )}
    </div>
  );
}

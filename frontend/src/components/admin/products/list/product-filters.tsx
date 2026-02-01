import { useId, useMemo, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { TListHandlerStore } from "@/stores";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import type { TProductListData } from "@shared/types/products/product.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { ProductListDto } from "@shared/dtos";

interface IProductFiltersProps {
  store: TListHandlerStore<IProduct, TProductListData, Record<string, unknown>>;
}

export function ProductFilters({ store }: IProductFiltersProps) {
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
        ...(filteredFields as TFieldConfigObject<ProductListDto>).search,
        placeholder: t("searchProducts"),
      },
    }),
    [filteredFields, t]
  );

  const inputs = useInput<ProductListDto>({
    fields: fields as TFieldConfigObject<ProductListDto>,
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

import { useId } from "react";
import { useShallow } from "zustand/shallow";
import { AppCard } from "@/components/layout-ui/app-card";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import { useI18n } from "@/hooks/use-i18n";
import { StoreProductCard } from "./list/store-product-card";
import type { TListHandlerStore } from "@/stores";
import type { TListHandlerComponentProps } from "@/@types/handler-types";

type TRelatedProductsExtraProps = Record<string, unknown>;

interface IRelatedProductsProps
  extends TListHandlerComponentProps<
    TListHandlerStore<IProduct, any, TRelatedProductsExtraProps>
  > {}

export function RelatedProducts({ storeKey, store }: IRelatedProductsProps) {
  const componentId = useId();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {t("list")} "{storeKey}" {t("notFound") || "not found"}.
      </div>
    );
  }

  const { response: products, isLoading } = store(
    useShallow((s) => ({
      response: s.response as IProduct[] | null,
      isLoading: s.isLoading,
    }))
  );

  // Don't render if nothing to show and not loading
  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t("relatedProducts") || "Related Products"}
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <AppCard key={idx} loading>
              {null}
            </AppCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products?.map((product) => (
            <StoreProductCard
              key={product.id}
              product={product}
              componentId={`related-product-${product.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

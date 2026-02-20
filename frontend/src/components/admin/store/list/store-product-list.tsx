import { useId, useTransition, useCallback } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { List as TList } from "@/components/list-ui/list";
import { storeProductItemViews } from "./store-product-item-views";
import type { TListHandlerStore, TSingleHandlerStore } from "@/stores";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import type { TListHandlerComponentProps } from "@/@types/handler-types";

export interface IStoreProductListExtraProps { }

interface IStoreProductListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<IProduct, any, IStoreProductListExtraProps>,
    TSingleHandlerStore<IProduct, unknown>
  > { }

export default function StoreProductList({
  storeKey,
  store,
  singleStore,
}: IStoreProductListProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "list", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }
  if (!singleStore) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }

  const setAction = singleStore((s) => s.setAction);

  const handleView = useCallback(
    (id: string) => {
      startTransition(() => setAction("view", id));
    },
    [setAction, startTransition]
  );

  const handleAddToCart = useCallback(
    (id: string) => {
      startTransition(() => setAction("addToCart", id));
    },
    [setAction, startTransition]
  );

  const { listItem } = storeProductItemViews({
    handleView,
    handleAddToCart,
    componentId,
  });

  return (
    <div className="p-2" data-component-id={componentId}>
      <TList<IProduct>
        listStore={store}
        emptyMessage={t("noProductsFound")}
        showPagination
        renderItem={listItem}
        rowClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        getItemKey={(item) => item.id}
      />
    </div>
  );
}

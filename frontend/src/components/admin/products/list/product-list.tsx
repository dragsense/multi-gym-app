import { useId, useTransition, useCallback } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { List as TList } from "@/components/list-ui/list";
import { productItemViews } from "./product-item-views";
import { ProductFilters } from "./product-filters";
import type { TListHandlerStore, TSingleHandlerStore } from "@/stores";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import type { TProductListData } from "@shared/types/products/product.type";
import type { TListHandlerComponentProps } from "@/@types/handler-types";

export interface IProductListExtraProps {}

interface IProductListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<IProduct, TProductListData, IProductListExtraProps>,
    TSingleHandlerStore<IProduct, unknown>
  > {}

export default function ProductList({
  storeKey,
  store,
  singleStore,
}: IProductListProps) {
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

  const setListAction = store((s) => s.setAction);
  const setAction = singleStore((s) => s.setAction);

  const handleCreate = useCallback(() => {
    startTransition(() => setAction("createOrUpdate"));
  }, [setAction, startTransition]);

  const handleEdit = useCallback(
    (id: string) => {
      startTransition(() => setAction("createOrUpdate", id));
    },
    [setAction, startTransition]
  );
  const handleDelete = useCallback(
    (id: string) => {
      startTransition(() => setListAction("delete", id));
    },
    [setListAction, startTransition]
  );
  const handleView = useCallback(
    (id: string) => {
      startTransition(() => setAction("view", id));
    },
    [setAction, startTransition]
  );

  const { listItem } = productItemViews({
    handleEdit,
    handleDelete,
    handleView,
    componentId,
  });

  return (
    <div className="p-2" data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-4 mb-6 flex-wrap">
        <ProductFilters store={store} />
        <Button onClick={handleCreate} variant="default" data-component-id={componentId}>
          <Plus className="h-4 w-4 mr-2" />
          <span>{t("addProduct")}</span>
        </Button>
      </div>

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

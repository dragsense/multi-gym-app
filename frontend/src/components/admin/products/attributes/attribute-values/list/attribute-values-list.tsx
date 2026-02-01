import { useId, useTransition, useCallback, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";
import { itemViews } from "./attribute-values-item-views";
import { AttributeValuesFilters } from "./attribute-values-filters";
import type { TListHandlerStore, TSingleHandlerStore } from "@/stores";
import type { IAttributeValue } from "@shared/interfaces/products/attribute-value.interface";
import type { TAttributeValueListData } from "@shared/types/products/attribute-value.type";
import type { TListHandlerComponentProps } from "@/@types/handler-types";

export interface IAttributeValuesListExtraProps { }

interface IAttributeValuesListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<IAttributeValue, TAttributeValueListData, IAttributeValuesListExtraProps>,
    TSingleHandlerStore<IAttributeValue, any>
  > { }

export default function AttributeValuesList({
  storeKey,
  store,
  singleStore,
}: IAttributeValuesListProps) {
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
    (id: string) => startTransition(() => setAction("createOrUpdate", id)),
    [setAction, startTransition]
  );
  const handleDelete = useCallback(
    (id: string) => startTransition(() => setListAction("delete", id)),
    [setListAction, startTransition]
  );

  const { columns } = itemViews({
    handleEdit,
    handleDelete,
    componentId,
  });

  return (
    <div data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
        <AttributeValuesFilters store={store} />
        <Button onClick={handleCreate}>
          <Plus />
          <span className="hidden sm:inline ml-2">
            {buildSentence(t, "add", "attribute", "value")}
          </span>
        </Button>
      </div>
      <AppCard className="px-0">
        <TTable<IAttributeValue>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, "no", "attribute", "values", "found")}
          showPagination
        />
      </AppCard>
    </div>
  );
}

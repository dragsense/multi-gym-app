import { useId, useTransition, useCallback } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";
import { itemViews } from "./attribute-item-views";
import { AttributeFilters } from "./attribute-filters";
import type { TListHandlerStore, TSingleHandlerStore } from "@/stores";
import type { IAttribute } from "@shared/interfaces/products/attribute.interface";
import type { TAttributeListData } from "@shared/types/products/attribute.type";
import type { TListHandlerComponentProps } from "@/@types/handler-types";

export interface IAttributeListExtraProps {
  attributeId?: string;
}

interface IAttributeListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<IAttribute, TAttributeListData, IAttributeListExtraProps>,
    TSingleHandlerStore<IAttribute, unknown>
  > {}

export default function AttributeList({ storeKey, store, singleStore }: IAttributeListProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) return <div>{buildSentence(t, "list", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.</div>;
  if (!singleStore) return <div>{buildSentence(t, "single", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.</div>;

  const setListAction = store((s) => s.setAction);
  const setAction = singleStore((s) => s.setAction);
  const setExtra = store((s) => s.setExtra);

  const handleCreate = useCallback(() => startTransition(() => setAction("createOrUpdate")), [setAction, startTransition]);
  const handleEdit = useCallback((id: string) => startTransition(() => setAction("createOrUpdate", id)), [setAction, startTransition]);
  const handleDelete = useCallback((id: string) => startTransition(() => setListAction("delete", id)), [setListAction, startTransition]);
  const handleManageValues = useCallback((attribute: IAttribute) => {
    startTransition(() => {
      setExtra("attribute", attribute);
      setListAction("manageAttributeValues");
    });
  }, [setExtra, setListAction, startTransition]);

  const { columns } = itemViews({
    handleEdit,
    handleDelete,
    handleManageValues,
    componentId,
  });

  return (
    <div data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
        <AttributeFilters store={store} />
        <Button onClick={handleCreate}>
          <Plus />
          <span className="hidden sm:inline ml-2">{buildSentence(t, "add", "attribute")}</span>
        </Button>
      </div>
      <AppCard className="px-0">
        <TTable<IAttribute>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, "no", "attributes", "found")}
          showPagination
        />
      </AppCard>
    </div>
  );
}

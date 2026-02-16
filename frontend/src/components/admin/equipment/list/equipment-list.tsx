// React & Hooks
import { useId, useTransition, useCallback } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus, Package } from "lucide-react";

// Types
import { type IEquipment } from "@shared/interfaces/equipment-reservation.interface";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { equipmentItemViews } from "./equipment-item-views";
import { EquipmentFilters } from "./equipment-filters";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TEquipmentListData } from "@shared/types/equipment-reservation.type";

export interface IEquipmentListExtraProps { }

interface IEquipmentListProps extends TListHandlerComponentProps<
  TListHandlerStore<IEquipment, TEquipmentListData, IEquipmentListExtraProps>,
  TSingleHandlerStore<IEquipment, any>
> { }

export default function EquipmentList({
  storeKey,
  store,
  singleStore
}: IEquipmentListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  if (!singleStore) {
    return `${buildSentence(t, 'single', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const setListAction = store(state => state.setAction);
  const setAction = singleStore(state => state.setAction);

  // React 19: Smooth action transitions - memoized to prevent infinite loops
  const handleCreate = useCallback(() => {
    startTransition(() => {
      setAction('createOrUpdate');
    });
  }, [setAction, startTransition]);

  const handleEdit = useCallback((id: string) => {
    startTransition(() => {
      setAction('createOrUpdate', id);
    });
  }, [setAction, startTransition]);

  const handleDelete = useCallback((id: string) => {
    startTransition(() => {
      setListAction('delete', id);
    });
  }, [setAction, startTransition]);

  const handleView = useCallback((id: string) => {
    startTransition(() => {
      setAction('view', id);
    });
  }, [setAction, startTransition]);

  const handleManageEquipmentTypes = useCallback(() => {
    startTransition(() => {
      setListAction('manageEquipmentTypes');
    });
  }, [setListAction, startTransition]);

  const { columns } = equipmentItemViews({
    handleEdit,
    handleDelete,
    handleView,
    componentId,
  });

  return (
    <div data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
        <EquipmentFilters store={store} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleManageEquipmentTypes}
            data-component-id={componentId}
          >
            <Package className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline capitalize">{buildSentence(t, 'manage', 'equipment', 'types')}</span>
          </Button>
          <Button
            onClick={handleCreate}
            data-component-id={componentId}
          >
            <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'equipment')}</span>
          </Button>
        </div>
      </div>

      <AppCard className="px-0">
        <TTable<IEquipment>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'equipment', 'found')}
          showPagination={true}
        />
      </AppCard>
    </div>
  );
}

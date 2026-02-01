// React & Hooks
import { useId, useTransition, useCallback, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type IEquipmentReservation } from "@shared/interfaces/equipment-reservation.interface";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { equipmentReservationItemViews } from "./equipment-reservation-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TEquipmentReservationListData } from "@shared/types/equipment-reservation.type";

export interface IEquipmentReservationListExtraProps { }

interface IEquipmentReservationListProps extends TListHandlerComponentProps<
  TListHandlerStore<IEquipmentReservation, TEquipmentReservationListData, IEquipmentReservationListExtraProps>,
  TSingleHandlerStore<IEquipmentReservation, any>
> { }

export default function EquipmentReservationList({
  storeKey,
  store,
  singleStore
}: IEquipmentReservationListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { settings } = useUserSettings();

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
  }, [setListAction, startTransition]);

  const handleView = useCallback((id: string) => {
    startTransition(() => {
      setAction('view', id);
    });
  }, [setAction, startTransition]);

  const { columns } = useMemo(() => equipmentReservationItemViews({
    handleEdit,
    handleDelete,
    handleView,
    componentId,
    settings,
  }), [handleEdit, handleDelete, handleView, componentId, settings]);

  return (
    <div data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
        <div className="flex-1" />
        <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'equipment', 'reservation')}</span>
        </Button>
      </div>

      <AppCard className="px-0">
        <TTable<IEquipmentReservation>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'equipment', 'reservations', 'found')}
          showPagination={true}
        />
      </AppCard>
    </div>
  );
}

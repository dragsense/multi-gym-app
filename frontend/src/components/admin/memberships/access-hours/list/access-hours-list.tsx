// React & Hooks
import { useId, useTransition, useCallback, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type IAccessHour } from "@shared/interfaces/access-hour.interface";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { accessHoursItemViews } from "./access-hours-item-views";
import { AccessHoursFilters } from "./access-hours-filters";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TAccessHourListData } from "@shared/types/access-hour.type";

export interface IAccessHoursListExtraProps { }

interface IAccessHoursListProps extends TListHandlerComponentProps<
  TListHandlerStore<IAccessHour, TAccessHourListData, IAccessHoursListExtraProps>,
  TSingleHandlerStore<IAccessHour, any>
> { }

export default function AccessHoursList({
  storeKey,
  store,
  singleStore
}: IAccessHoursListProps) {
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
  }, [setAction, startTransition]);

  const { columns } = useMemo(() => accessHoursItemViews({
    handleEdit,
    handleDelete,
    settings,
    componentId,
  }), [handleEdit, handleDelete, settings, componentId]);

  return (
    <div data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
        <AccessHoursFilters store={store} />
        <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'access', 'hours')}</span>
        </Button>
      </div>

      <AppCard className="px-0">
        <TTable<IAccessHour>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'access', 'hours', 'found')}
          showPagination={true}
        />
      </AppCard>
    </div>
  );
}


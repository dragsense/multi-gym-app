// React & Hooks
import { useId, useTransition, useCallback, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type IAccessFeature } from "@shared/interfaces/access-feature.interface";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { accessFeaturesItemViews } from "./access-features-item-views";
import { AccessFeaturesFilters } from "./access-features-filters";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TAccessFeatureListData } from "@shared/types/access-feature.type";

export interface IAccessFeaturesListExtraProps { }

interface IAccessFeaturesListProps extends TListHandlerComponentProps<
  TListHandlerStore<IAccessFeature, TAccessFeatureListData, IAccessFeaturesListExtraProps>,
  TSingleHandlerStore<IAccessFeature, any>
> { }

export default function AccessFeaturesList({
  storeKey,
  store,
  singleStore
}: IAccessFeaturesListProps) {
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

  const { columns } = useMemo(() => accessFeaturesItemViews({
    handleEdit,
    handleDelete,
    componentId,
  }), [handleEdit, handleDelete, componentId]);

  return (
    <div data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
        <AccessFeaturesFilters store={store} />
        <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'access', 'features')}</span>
        </Button>
      </div>

      <AppCard className="px-0">
        <TTable<IAccessFeature>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'access', 'features', 'found')}
          showPagination={true}
        />
      </AppCard>
    </div>
  );
}


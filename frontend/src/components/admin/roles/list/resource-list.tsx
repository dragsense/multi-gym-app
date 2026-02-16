// External Libraries
import { useId, useMemo, useTransition } from "react";
import { useUserSettings } from '@/hooks/use-user-settings';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TListHandlerComponentProps } from "@/@types/handler-types";
import type { TListHandlerStore, TSingleHandlerStore } from "@/stores";
import type { IResource } from '@shared/interfaces';
import type { TResourceListData } from "@shared/types";

// Components
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";
import { ResourceFilters } from "./resource-filters";
import { itemViews } from "./resource-item-views";

// Types
export interface TResourceListExtraProps {
  // Add any extra props needed for resource list
}

interface IResourceListProps extends TListHandlerComponentProps<TListHandlerStore<IResource, TResourceListData, TResourceListExtraProps>,
  TSingleHandlerStore<IResource, any>> {
}

export const ResourceList = ({
  storeKey,
  store,
  singleStore
}: IResourceListProps) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  if (!store) {
    return <div>{buildSentence(t, 'list', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  if (!singleStore) {
    return <div>{buildSentence(t, 'single', 'store')} "{singleStore}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  const setAction = store(state => state.setAction);
  const setSingleAction = singleStore(state => state.setAction);

  // React 19: Smooth resource actions
  const editResource = (resourceId: string) => {
    startTransition(() => {
      setAction('update', resourceId);
    });
  };

  const deleteResource = (resourceId: string) => {
    startTransition(() => {
      setSingleAction('delete', resourceId);
    });
  };

  // React 19: Memoized columns for better performance
  const { columns } = useMemo(() => itemViews({ editResource, deleteResource, settings }), [editResource, deleteResource, settings]);

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <ResourceFilters store={store} />

      <AppCard className="px-0">
        <TTable<IResource>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'resources', 'found')}
          showPagination={true}
        />
      </AppCard>
    </div>
  );
}

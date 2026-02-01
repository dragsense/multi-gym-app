// React & Hooks
import { useId, useTransition } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type IAdvertisement } from "@shared/interfaces/advertisement.interface";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { List as TList } from "@/components/list-ui/list";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { itemViews } from "./advertisement-item-views";
import { AdvertisementFilters } from "./advertisement-filters";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";

export interface IAdvertisementListExtraProps { }

interface IAdvertisementListProps extends TListHandlerComponentProps<TListHandlerStore<IAdvertisement, any, IAdvertisementListExtraProps>,
  TSingleHandlerStore<IAdvertisement, any>> {
}

export default function AdvertisementList({
  storeKey,
  store,
  singleStore
}: IAdvertisementListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return (`${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`);
  }

  if (!singleStore) {
    return `${buildSentence(t, 'single', 'store')} "${singleStore}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const setAction = singleStore(state => state.setAction);
  const setListAction = store(state => state.setAction);
  // React 19: Smooth action transitions
  const handleCreate = () => {
    startTransition(() => {
      setAction('createOrUpdate');
    });
  };

  const handleEdit = (id: string) => {
    startTransition(() => {
      setAction('createOrUpdate', id);
    });
  }

  const handleDelete = (id: string) => {
    startTransition(() => {
      setListAction('delete', id);
    });
  }

  const handleView = (id: string) => {
    startTransition(() => {
      setAction('view', id);
    });
  }

  const { listItem } = itemViews({
    handleEdit,
    handleDelete,
    handleView,
    componentId,
  });

  return (
    <div className="p-2" data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-4 mb-6">
        <AdvertisementFilters store={store} />
        <Button
          onClick={handleCreate}
          variant="default"
          data-component-id={componentId}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>{t('create')}</span>
        </Button>
      </div>

      <TList<IAdvertisement>
        listStore={store}
        emptyMessage={buildSentence(t, 'no', 'advertisements', 'found')}
        showPagination={true}
        renderItem={listItem}
        rowClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
      />
    </div>
  );
}


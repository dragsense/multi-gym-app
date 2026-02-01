// React & Hooks
import { useState, useId, useTransition } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type IServiceOffer } from "@shared/interfaces/service-offer.interface";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";

// Local
import { itemViews } from "./service-offer-item-views";
import { ServiceOfferFilters } from "./service-offer-filters";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";

export interface IServiceOfferListExtraProps { }

interface IServiceOfferListProps extends TListHandlerComponentProps<TListHandlerStore<IServiceOffer, any, IServiceOfferListExtraProps>,
  TSingleHandlerStore<IServiceOffer, any>> {
}

type ViewType = "table" | "list";

export default function ServiceOfferList({
  storeKey,
  store,
  singleStore
}: IServiceOfferListProps) {
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
  const [currentView, setCurrentView] = useState<ViewType>("table");
  
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

  const { columns, listItem } = itemViews({
    handleEdit,
    handleDelete,
    handleView,
    componentId,
    t,
  });

  return (
    <Tabs
      value={currentView}
      onValueChange={(value) => setCurrentView(value as ViewType)}
      data-component-id={componentId}
    >
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <ServiceOfferFilters store={store} />
        <ViewToggle componentId={componentId} />
        <Button onClick={handleCreate} data-component-id={componentId}>
          <Plus />{" "}
          <span className="hidden sm:inline capitalize">
            {buildSentence(t, "add", "service", "offer")}
          </span>
        </Button>
      </div>

      <TabsContent value="table">
        <TTable<IServiceOffer>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, "no", "serviceOffers", "found")}
          showPagination={true}
        />
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<IServiceOffer>
            listStore={store}
            emptyMessage={buildSentence(t, "no", "serviceOffers", "found")}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}


// React & Hooks
import { useEffect, useState, useId, useMemo, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type ISubscription } from "@shared/interfaces";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";

import { SubscriptionFilters } from "./subscription-filters";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { SubscriptionItemViews as itemViews } from "./subscription-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TSubscriptionListData } from "@shared/types";
import type { TSubscriptionViewExtraProps } from "../view/subscription-view";

export interface ISubscriptionListExtraProps {
  level: number;
}

interface ISubscriptionListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<
      ISubscription,
      TSubscriptionListData,
      ISubscriptionListExtraProps
    >,
    TSingleHandlerStore<ISubscription, TSubscriptionViewExtraProps>
  > { }

type ViewType = "table" | "list";

export default function SubscriptionList({
  storeKey,
  store,
  singleStore
}: ISubscriptionListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const [currentView, setCurrentView] = useState<ViewType>("table");
  const { t } = useI18n();

  if (!store) {
    return (`${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`);
  }

  if (!singleStore) {
    return `${buildSentence(t, 'single', 'store')} "${singleStore}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const setListAction = store(state => state.setAction);
  const setAction = singleStore(state => state.setAction);

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
      setAction('delete', id);
    });
  }

  const handleView = (id: string | number) => {
    startTransition(() => {
      setAction('view', id);
    });
  }

  const { columns, listItem } = itemViews({
    handleEdit,
    handleDelete,
    handleView,
  });

  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <SubscriptionFilters store={store} />
        {/* <ViewToggle componentId={componentId} /> */}
        <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'subscription')}</span>
        </Button>
      </div>

      <TabsContent value="table">
        <TTable<ISubscription>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'subscriptions', 'found')}
          showPagination={true}
        />
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<ISubscription>
            listStore={store}
            emptyMessage={buildSentence(t, 'no', 'subscriptions', 'found')}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

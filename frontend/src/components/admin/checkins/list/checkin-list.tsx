// React & Hooks
import { useState, useId, useTransition, useCallback, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

import { useQueryClient } from "@tanstack/react-query";
// External libraries
import { Plus } from "lucide-react";

// Types
import { type ICheckin } from "@shared/interfaces/checkin.interface";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { CheckinFilters } from "./checkin-filters";
import { checkinItemViews } from "./checkin-item-views";
import { CheckinTestButton } from "./checkin-test-button";
import { CheckinRfidButton } from "./checkin-rfid-button";
import { CheckinMainDoorButton } from "./checkin-main-door-button";
import { CheckinBackDoorButton } from "./checkin-back-door-button";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TCheckinListData } from "@shared/types/checkin.type";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

export interface ICheckinListExtraProps { }

interface ICheckinListProps extends TListHandlerComponentProps<
  TListHandlerStore<ICheckin, TCheckinListData, ICheckinListExtraProps>,
  TSingleHandlerStore<ICheckin, any>
> { }

type ViewType = "table" | "list";

export default function CheckinList({
  storeKey,
  store,
  singleStore
}: ICheckinListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const queryClient = useQueryClient();

  if (!store) {
    return `${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  if (!singleStore) {
    return `${buildSentence(t, 'single', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const setAction = singleStore(state => state.setAction);
  const setListAction = store(state => state.setAction);

  const [currentView, setCurrentView] = useState<ViewType>("table");

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

  const handleCheckout = useCallback((id: string) => {
    startTransition(() => {
      setAction('checkout', id);
    });
  }, [setAction, startTransition]);

  const { columns, listItem } = useMemo(() => checkinItemViews({
    handleEdit,
    handleDelete,
    handleView,
    handleCheckout,
    componentId,
  }), [handleEdit, handleDelete, handleView, handleCheckout, componentId]);

  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <CheckinFilters store={store} />
        <div className="flex items-center gap-2">
          <CheckinTestButton onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
          }} />
          <CheckinMainDoorButton onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
          }} />
          <CheckinBackDoorButton onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
          }} />
          <ViewToggle componentId={componentId} />
          {user?.level <= EUserLevels.ADMIN && <Button
            onClick={handleCreate}
            data-component-id={componentId}
          >
            <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'checkin')}</span>
          </Button>}
        </div>
      </div>

      <TabsContent value="table">
        <AppCard className="px-0">
          <TTable<ICheckin>
            listStore={store}
            columns={columns}
            emptyMessage={buildSentence(t, 'no', 'checkins', 'found')}
            showPagination={true}
          />
        </AppCard>
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<ICheckin>
            listStore={store}
            emptyMessage={buildSentence(t, 'no', 'checkins', 'found')}
            showPagination={true}
            renderItem={(checkin) => listItem(checkin, user)}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}


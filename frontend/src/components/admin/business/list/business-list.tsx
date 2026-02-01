// React & Hooks
import { useState, useId, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { toast } from "sonner";

// External libraries
import { Plus } from "lucide-react";

// Services
import { loginToBusiness } from "@/services/business/business.api";

// Types
import { type IBusiness } from "@shared/interfaces";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { AppCard } from "@/components/layout-ui/app-card";

import { BusinessFilters } from "./business-filters";

// Local
import { BusinessItemViews as itemViews } from "./business-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TBusinessListData } from "@shared/types";
import type { TBusinessViewExtraProps } from "../view/business-view";

export interface IBusinessListExtraProps {
  level: number;
}

interface IBusinessListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<
      IBusiness,
      TBusinessListData,
      IBusinessListExtraProps
    >,
    TSingleHandlerStore<IBusiness, TBusinessViewExtraProps>
  > { }

type ViewType = "table" | "list";

export default function BusinessList({
  storeKey,
  store,
  singleStore
}: IBusinessListProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const [currentView, setCurrentView] = useState<ViewType>("table");
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  if (!store) {
    return (`${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`);
  }

  if (!singleStore) {
    return `${buildSentence(t, 'single', 'store')} "${singleStore}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const setListAction = store(state => state.setAction);
  const setAction = singleStore(state => state.setAction);

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

  const handleView = (businessId: string | number) => {
    startTransition(() => {
      setAction('view', businessId);
    });
  }


  const handleRowClick = (business: IBusiness) => {
    const segment = SEGMENTS[user.level];
    const detailPath = `${segment}/${ADMIN_ROUTES.BUSINESS_DETAIL.replace(':id', String(business.id))}`;
    startTransition(() => {
      navigate(detailPath);
    });
  };

  const handleLoginToBusiness = async (businessId: string) => {
    try {
      const response = await loginToBusiness(businessId);
      if (response.redirectUrl) {
        // Open in new tab to preserve current session
        window.open(response.redirectUrl, '_blank');
        toast.success('Redirecting to business portal...');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to login to business');
    }
  };

  const { columns, listItem } = itemViews({
    handleEdit,
    handleDelete,
    handleView,
    handleLoginToBusiness,
  });

  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <BusinessFilters store={store} />
        <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'business')}</span>
        </Button>
      </div>

      <TabsContent value="table">
        <AppCard className="px-0">
          <TTable<IBusiness>
            listStore={store}
            columns={columns}
            emptyMessage={buildSentence(t, 'no', 'businesses', 'found')}
            showPagination={true}
            onRowClick={handleRowClick}
            rowClassName={() => "cursor-pointer hover:bg-muted/50 transition-colors"}
          />
        </AppCard>
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<IBusiness>
            listStore={store}
            emptyMessage={buildSentence(t, 'no', 'businesses', 'found')}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

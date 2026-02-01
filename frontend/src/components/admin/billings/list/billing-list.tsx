// React & Hooks
import { useState, useId, useTransition } from "react";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type IBilling } from "@shared/interfaces/billing.interface";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";

// Local
import { BillingFilters } from "./billing-filters";
import { billingItemViews as itemViews } from "./billing-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TBillingListData } from "@shared/types/billing.type";
import { ViewToggle } from "@/components/shared-ui/view-toggle";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

export interface IBillingListExtraProps extends Record<string, never> {
  // Add any extra props if needed
}

interface IBillingListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<IBilling, TBillingListData, IBillingListExtraProps>,
    TSingleHandlerStore<IBilling, any>
  > {}

type ViewType = "table" | "list";

export default function BillingList({
  storeKey,
  store,
  singleStore,
}: IBillingListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { settings } = useUserSettings();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const [currentView, setCurrentView] = useState<ViewType>("table");

  if (!store) {
    return (
      <div>
        {buildSentence(t, "list", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!singleStore) {
    return `${buildSentence(
      t,
      "single",
      "store"
    )} "${singleStore}" ${buildSentence(t, "not", "found")}. ${buildSentence(
      t,
      "did",
      "you",
      "forget",
      "to",
      "register",
      "it"
    )}?`;
  }

  const setSingleAction = singleStore((state) => state.setAction);
  const setListAction = store((state) => state.setAction);

  // React 19: Smooth action transitions
  const handleCreate = () => {
    startTransition(() => {
      setSingleAction("createOrUpdate");
    });
  };

  const handleEdit = (id: string) => {
    startTransition(() => {
      setSingleAction("createOrUpdate", id);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      setListAction("delete", id);
    });
  };

  const handleView = (id: string) => {
    startTransition(() => {
      setSingleAction("view", id);
    });
  };

  const handlePayment = (id: string) => {
    startTransition(() => {
      setSingleAction("pay", id);
    });
  };

  const handleSendEmail = (id: string) => {
    startTransition(() => {
      setListAction("sendEmail", id);
    });
  };

  const handleInvoice = (id: string) => {
    startTransition(() => {
      setSingleAction("invoice", id);
    });
  };

  const handleCashPayment = (id: string) => {
    startTransition(() => {
      setSingleAction("cashPayment", id);
    });
  };

  const { columns, listItem } = itemViews({
    handleEdit,
    handleDelete,
    handleView,
    handlePayment,
    handleSendEmail,
    handleInvoice,
    handleCashPayment,
    settings,
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
        <BillingFilters store={store} />
        <ViewToggle componentId={componentId} />
        {user?.level === EUserLevels.ADMIN && <Button onClick={handleCreate} data-component-id={componentId}>
          <Plus />{" "}
          <span className="hidden sm:inline capitalize">
            {buildSentence(t, "add", "billing")}
          </span>
        </Button>
        }
      </div>

      <TabsContent value="table">
        <TTable<IBilling>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, "no", "billings", "found")}
          showPagination={true}
        />
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<IBilling>
            listStore={store}
            emptyMessage={buildSentence(t, "no", "billings", "found")}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

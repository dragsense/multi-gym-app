// React & Hooks
import { useId, useTransition, useCallback, useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// UI Components
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";
import { useUserSettings } from "@/hooks/use-user-settings";

// Local
import { orderItemViews } from "./order-item-views";
import { OrderFilters } from "./order-filters";

// Types
import type { TListHandlerStore, TSingleHandlerStore } from "@/stores";
import type { IOrder } from "@shared/interfaces/order.interface";
import type { TListHandlerComponentProps } from "@/@types/handler-types";
import type { OrderListDto } from "@shared/dtos";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { buildRoutePath } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export interface IOrderListExtraProps extends Record<string, unknown> { }

interface IOrderListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<IOrder, OrderListDto, IOrderListExtraProps>,
    TSingleHandlerStore<IOrder, unknown>
  > { }

type ViewType = "table" | "list";

export default function OrderList({
  storeKey,
  store,
  singleStore,
}: IOrderListProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const [currentView, setCurrentView] = useState<ViewType>("table");
  const { user } = useAuthUser();
  const navigate = useNavigate();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "list", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }
  if (!singleStore) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }

  const setAction = singleStore((s) => s.setAction);

  const handleView = useCallback(
    (id: string) => {
      startTransition(() => setAction("view", id));
    },
    [setAction, startTransition]
  );

  const { listItem, columns } = orderItemViews({
    handleView,
    componentId,
    settings,
    t
  });

  const handleRowClick = useCallback(
    (order: IOrder) => {
      const segment = SEGMENTS[user.level ?? -1] ?? "/admin";
      const detailPath = buildRoutePath(`${segment}/${ADMIN_ROUTES.ORDER_DETAIL.replace(':id', order.id)}`);
      startTransition(() => {
        navigate(detailPath);
      });
    },
    [startTransition]
  );

  return (
    <Tabs
      value={currentView}
      onValueChange={(value) => setCurrentView(value as ViewType)}
      data-component-id={componentId}
    >
      <div className="flex flex-1 justify-between items-center gap-2 mb-6">
        <OrderFilters store={store} />
        <ViewToggle componentId={componentId} />
      </div>

      <TabsContent value="table">
        <TTable<IOrder>
          listStore={store}
          columns={columns}
          emptyMessage={t("noOrdersFound") || "No orders found."}
          showPagination
          onRowClick={handleRowClick}
          rowClassName={() => "cursor-pointer hover:bg-muted/50 transition-colors"}
        />
      </TabsContent>

      <TabsContent value="list">
        <TList<IOrder>
          listStore={store}
          emptyMessage={t("noOrdersFound") || "No orders found."}
          showPagination
          renderItem={listItem}
          rowClassName="space-y-4"
          getItemKey={(item) => item.id}
        />
      </TabsContent>
    </Tabs>
  );
}

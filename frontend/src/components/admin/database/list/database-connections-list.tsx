import { useState, useId, useTransition } from "react";
import { Database } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";
import { databaseConnectionItemViews } from "./database-connection-item-views";
import type { IDatabaseConnection } from "@shared/interfaces";
import type { TListHandlerStore } from "@/stores";
import type { TListHandlerComponentProps } from "@/@types/handler-types";

interface IDatabaseConnectionsListProps
  extends TListHandlerComponentProps<TListHandlerStore<IDatabaseConnection, any, any>> {}

type ViewType = "table" | "list";

export function DatabaseConnectionsList({
  storeKey,
  store,
}: IDatabaseConnectionsListProps) {
  const componentId = useId();
  const { t } = useI18n();
  const [currentView, setCurrentView] = useState<ViewType>("table");

  if (!store) {
    return (
      <div>
        {buildSentence(t, "list", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }


  const { columns, listItem } = databaseConnectionItemViews({
    componentId,
    t,
  });

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        <h2 className="text-lg font-semibold">
          {buildSentence(t, "database", "connections")}
        </h2>
      </div>
      <Tabs
        value={currentView}
        onValueChange={(value) => setCurrentView(value as ViewType)}
        data-component-id={componentId}
      >
        <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
          <ViewToggle componentId={componentId} />
        </div>

        <TabsContent value="table">
          <TTable<IDatabaseConnection>
            listStore={store}
            columns={columns}
            emptyMessage={buildSentence(t, "no", "database", "connections", "found")}
            showPagination={true}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </TabsContent>

        <TabsContent value="list">
          <div>
            <TList<IDatabaseConnection>
              listStore={store}
              emptyMessage={buildSentence(t, "no", "database", "connections", "found")}
              showPagination={true}
              renderItem={listItem}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

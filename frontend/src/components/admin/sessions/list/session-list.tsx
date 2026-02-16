// React & Hooks
import { useEffect, useState, useId, useMemo, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { List, Plus, Table } from "lucide-react";

// Types
import { type ISession } from "@shared/interfaces/session.interface";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";

import { SessionFilters } from "./session-filters";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { sessionItemViews as itemViews } from "./session-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TSessionListData } from "@shared/types/session.type";
import { ViewToggle } from "@/components/shared-ui/view-toggle";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums/user.enum";
import { EUpdateSessionScope } from "@shared/enums/session.enum";

export interface ISessionListExtraProps {
  // Add any extra props if needed
}

interface ISessionListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<ISession, TSessionListData, ISessionListExtraProps>,
    TSingleHandlerStore<ISession, any>
  > {}

type ViewType = "table" | "list";

export default function SessionList({
  storeKey,
  store,
  singleStore,
}: ISessionListProps) {
  const { user } = useAuthUser();

  const componentId = useId();
  const [, startTransition] = useTransition();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, "list", "store")} "${storeKey}" ${buildSentence(
      t,
      "not",
      "found"
    )}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
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

  const setAction = singleStore((state) => state.setAction);
  const setListAction = store((state) => state.setAction);
  const setExtra = singleStore((state) => state.setExtra);
  const [currentView, setCurrentView] = useState<ViewType>("table");

  // React 19: Smooth action transitions
  const handleCreate = () => {
    startTransition(() => {
      setAction("createOrUpdate");
    });
  };

  const handleEdit = (id: string) => {
    startTransition(() => {
      setAction("createOrUpdate", id);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      setListAction("delete", { id, scope: EUpdateSessionScope.ALL });
    });
  };

  const handleView = (id: string) => {
    startTransition(() => {
      setAction("view", id);
    });
  };

  const handleEditNotes = (id: string) => {
    startTransition(() => {
      setExtra("updateScope", EUpdateSessionScope.ALL);
      setAction("notes", id);
    });
  };

  const { columns, listItem } = itemViews({
    handleEdit,
    handleDelete,
    handleView,
    handleEditNotes,
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
        <SessionFilters store={store} />
        <ViewToggle componentId={componentId} />
        {user?.level <= EUserLevels.STAFF ? (
          <Button onClick={handleCreate} data-component-id={componentId}>
            <Plus />{" "}
            <span className="hidden sm:inline capitalize">
              {buildSentence(t, "add", "session")}
            </span>
          </Button>
        ) : null}
      </div>

      <TabsContent value="table">
        <TTable<ISession>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, "no", "sessions", "found")}
          showPagination={true}
        />
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<ISession>
            listStore={store}
            emptyMessage={buildSentence(t, "no", "sessions", "found")}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

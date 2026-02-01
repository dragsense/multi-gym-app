// React & Hooks
import { useEffect, useState, useId, useMemo, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type IMember } from "@shared/interfaces/member.interface";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";

import { MemberFilters } from "./member-filters";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { memberItemViews as itemViews } from "./member-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TMemberListData } from "@shared/types/member.type";
import type { TMemberViewExtraProps } from "../view/member-view";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";

export interface IMemberListExtraProps {
  level: number;
}

interface IMemberListProps extends TListHandlerComponentProps<TListHandlerStore<IMember, TMemberListData, IMemberListExtraProps>,
  TSingleHandlerStore<IMember, TMemberViewExtraProps>> {
}

type ViewType = "table" | "list";

export default function MemberList({
  storeKey,
  store,
  singleStore
}: IMemberListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
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

  const [currentView, setCurrentView] = useState<ViewType>("table");

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

  const handleUpdateProfile = (id: string) => {
    startTransition(() => {
      console.log('updateProfile', id);
      setListAction('updateProfile', id);
    });
  }

  const handleDelete = (id: string) => {
    startTransition(() => {
      setAction('delete', id);
    });
  }

  const handleView = (memberId: string | number) => {
    if (!user) return;
    const segment = SEGMENTS[user.level];
    const detailPath = `${segment}/${ADMIN_ROUTES.MEMBER_DETAIL.replace(':id', String(memberId))}`;
    startTransition(() => {
      navigate(detailPath);
    });
  }

  const handleRowClick = (member: IMember) => {
    handleView(member.id);
  };

  const { columns, listItem } = itemViews({
    handleEdit,
    handleDelete,
    handleView,
    handleUpdateProfile
  });

  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <MemberFilters store={store} />
        <ViewToggle componentId={componentId} />
        <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'member')}</span>
        </Button>
      </div>

      <TabsContent value="table">
        <AppCard className="px-0">
          <TTable<IMember>
            listStore={store}
            columns={columns}
            emptyMessage={buildSentence(t, 'no', 'members', 'found')}
            showPagination={true}
            onRowClick={handleRowClick}
            rowClassName={() => "cursor-pointer hover:bg-muted/50 transition-colors"}
          /></AppCard>
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<IMember>
            listStore={store}
            emptyMessage={buildSentence(t, 'no', 'members', 'found')}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

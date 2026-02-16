// React & Hooks
import {  useState, useId, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";


// Types
import { type ILinkMember } from "@shared/interfaces/link-member.interface";

// UI Components
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";

import { LinkMemberFilters } from "./link-member-filters";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { linkMemberItemViews as itemViews } from "./link-member-item-views";

// Stores
import { type TListHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TLinkMemberListData } from "@shared/types/link-member.type";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";

export interface ILinkMemberListExtraProps {
}

interface ILinkMemberListProps extends TListHandlerComponentProps<TListHandlerStore<ILinkMember, TLinkMemberListData, ILinkMemberListExtraProps>> {}

type ViewType = "table" | "list";

export default function LinkMemberList({
  storeKey,
  store,
}: ILinkMemberListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  if (!store) {
    return (`${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`);
  }


  const [currentView, setCurrentView] = useState<ViewType>("table");


  const handleView = (linkMemberId: string | number) => {
    if (!user) return;
    const segment = SEGMENTS[user.level];
    const detailPath = `${segment}/${ADMIN_ROUTES.LINK_MEMBERS.DETAIL.replace(':id', String(linkMemberId))}`;
    startTransition(() => {
      navigate(detailPath);
    });
  }

  const handleRowClick = (linkMember: ILinkMember) => {
    handleView(linkMember.id);
  };

  const { columns, listItem } = itemViews();

  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <LinkMemberFilters store={store} />
        <ViewToggle componentId={componentId} />
      </div>

      <TabsContent value="table">
        <AppCard className="px-0">
          <TTable<ILinkMember>
            listStore={store}
            columns={columns}
            emptyMessage={buildSentence(t, 'no', 'link', 'members', 'found')}
            showPagination={true}
            onRowClick={handleRowClick}
            rowClassName={() => "cursor-pointer hover:bg-muted/50 transition-colors"}
          /></AppCard>
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<ILinkMember>
            listStore={store}
            emptyMessage={buildSentence(t, 'no', 'link', 'members', 'found')}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

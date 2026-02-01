// React & Hooks
import { useState, useId, useTransition } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type IUser } from "@shared/interfaces/user.interface";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";

import { UserFilters } from "./user-filters";

// Local
import { userItemViews as itemViews } from "./user-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";


// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TUserListData } from "@shared/types";
import type { TUserViewExtraProps } from "../view/user-view";



export interface IUserListExtraProps {
  level: number;
}


type IUserListProps = TListHandlerComponentProps<TListHandlerStore<IUser, TUserListData, IUserListExtraProps>,
  TSingleHandlerStore<IUser, TUserViewExtraProps>>;

export type ViewType = "table" | "list";


export default function UserList({
  storeKey,
  store,
  singleStore
}: IUserListProps) {
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

  const handleUpdateProfile = (id: string) => {
    startTransition(() => {
      setListAction('updateProfile', id);
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
    handleUpdateProfile
  });

  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <UserFilters store={store} />
        <ViewToggle componentId={componentId} />
   {/*      <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'user')}</span>
        </Button> */}
      </div>

      <TabsContent value="table">
        <TTable<IUser>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'users', 'found')}
          showPagination={true}
        />
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<IUser>
            listStore={store}
            emptyMessage={buildSentence(t, 'no', 'users', 'found')}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
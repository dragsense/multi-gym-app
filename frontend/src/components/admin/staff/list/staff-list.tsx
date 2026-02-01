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

// Local
import { staffItemViews as itemViews } from "./staff-item-views";
import { StaffFilters } from "./staff-filters";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TStaffListData } from "@shared/types/staff.type";
import type { IStaff } from "@shared/interfaces/staff.interface";

interface IStaffListProps extends TListHandlerComponentProps<TListHandlerStore<IStaff, TStaffListData, any>,
  TSingleHandlerStore<IStaff, any>> {
}

type ViewType = "table" | "list";

export default function StaffList({
  storeKey,
  store,
  singleStore
}: IStaffListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

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
        <StaffFilters store={store} />
        <ViewToggle componentId={componentId} />
        <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'staff')}</span>
        </Button>
      </div>

      <TabsContent value="table">
        <TTable<IStaff>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'staff', 'members', 'found')}
          showPagination={true}
        />
      </TabsContent>

      <TabsContent value="list">
        <TList<IStaff>
          listStore={store}
          emptyMessage={buildSentence(t, 'no', 'staff', 'members', 'found')}
          showPagination={true}
          renderItem={listItem}
        />
      </TabsContent>
    </Tabs>
  );
}

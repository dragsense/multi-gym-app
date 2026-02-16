// React & Hooks
import { useState, useId, useMemo, useTransition } from "react";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { List, Plus, Table } from "lucide-react";

// Types
import { type IFileUpload } from "@shared/interfaces/file-upload.interface";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";

import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { itemViews } from "./file-item-views";
import { FileFilters } from "./file-filters";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import { ViewToggle } from "@/components/shared-ui/view-toggle";

export interface IFileListExtraProps { }

interface IFileListProps extends TListHandlerComponentProps<TListHandlerStore<IFileUpload, any, IFileListExtraProps>,
  TSingleHandlerStore<IFileUpload, any>> {
}

export type ViewType = "table" | "list";

export default function FileList({
  storeKey,
  store,
  singleStore
}: IFileListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  if (!store) {
    return (`${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`);
  }

  if (!singleStore) {
    return `${buildSentence(t, 'single', 'store')} "${singleStore}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

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

  const handleDelete = (id: string) => {
    startTransition(() => {
      setAction('delete', id);
    });
  }

  const handleView = (id: string) => {
    startTransition(() => {
      setAction('view', id);
    });
  }

  const { columns, listItem } = itemViews({
    handleEdit,
    handleDelete,
    handleView,
    settings,
    componentId,
  });



  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>

      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <FileFilters store={store} />
        <ViewToggle componentId={componentId} />
        <div className="flex gap-2">
          <Button
            onClick={handleCreate}
            variant="default"
            data-component-id={componentId}
          >
            <Plus /> <span className="hidden sm:inline">{t('create')}</span>
          </Button>

        </div>
      </div>

      <TabsContent value="table">
        <AppCard className="px-0">
          <TTable<IFileUpload>
            listStore={store}
            columns={columns}
            emptyMessage={buildSentence(t, 'no', 'files', 'found')}
            showPagination={true}
          /></AppCard>
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<IFileUpload>
            listStore={store}
            emptyMessage={buildSentence(t, 'no', 'files', 'found')}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>

    </Tabs>
  );
}


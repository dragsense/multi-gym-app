// External Libraries
import { useId, useMemo, useTransition } from "react";
import { useUserSettings } from '@/hooks/use-user-settings';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TListHandlerComponentProps } from "@/@types/handler-types";
import type { TListHandlerStore, TSingleHandlerStore } from "@/stores";
import type { IPermission } from '@shared/interfaces';

// Components
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";
import { PermissionFilters } from "./permission-filters";
import { itemViews } from "./permission-item-views";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Types
export type TPermissionListData = IPermission;
export interface TPermissionListExtraProps {
  // Add any extra props needed for permission list
}

interface IPermissionListProps extends TListHandlerComponentProps<TListHandlerStore<IPermission, TPermissionListData, TPermissionListExtraProps>,
  TSingleHandlerStore<IPermission, any>> {
}


export const PermissionList = ({
  storeKey,
  store,
  singleStore
}: IPermissionListProps) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  if (!store) {
    return <div>{buildSentence(t, 'list', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }



  const setAction = singleStore((state) => state.setAction);
  const setListAction = store(state => state.setAction);

  const handleCreate = () => {
    startTransition(() => {
      setAction('createOrUpdate');
    });
  };

  // React 19: Smooth permission actions
  const editPermission = (permissionId: string) => {
    startTransition(() => {
      setAction('createOrUpdate', permissionId);
    });
  };

  const deletePermission = (permissionId: string) => {
    startTransition(() => {
      setListAction('delete', permissionId);
    });
  };

  // React 19: Memoized columns for better performance
  const { columns } = useMemo(() => itemViews({ editPermission, deletePermission, settings }), [editPermission, deletePermission, settings]);


  return (
    <div className="space-y-4" data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <PermissionFilters store={store} />
        <div className="flex gap-2">
          <Button
            onClick={handleCreate}
            variant="default"
            data-component-id={componentId}
          >
            <Plus /> <span className="hidden sm:inline">{buildSentence(t, 'create', 'permission')}</span>
          </Button>
        </div>
      </div>

      <AppCard className="px-0">
        <TTable<IPermission>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'permissions', 'found')}
          showPagination={true}
        />
      </AppCard>
    </div>
  );
}

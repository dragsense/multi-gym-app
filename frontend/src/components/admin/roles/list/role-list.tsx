// External Libraries
import { useId, useMemo, useTransition } from "react";
import { useShallow } from 'zustand/shallow';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TListHandlerComponentProps } from "@/@types/handler-types";
import type { TListHandlerStore, TSingleHandlerStore } from "@/stores";
import type { IRole } from '@shared/interfaces';

// Components
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";
import { RoleFilters } from "./role-filters";
import { itemViews } from "./role-item-views";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Types
export type TRoleListData = IRole;
export interface TRoleListExtraProps {
  // Add any extra props needed for role list
}

interface IRoleListProps extends TListHandlerComponentProps<TListHandlerStore<IRole, TRoleListData, TRoleListExtraProps>,
  TSingleHandlerStore<IRole, any>> {
}

export const RoleList = ({
  storeKey,
  store,
  singleStore
}: IRoleListProps) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  if (!store) {
    return <div>{buildSentence(t, 'list', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  if (!singleStore) {
    return <div>{buildSentence(t, 'single', 'store')} "{singleStore}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  const setAction = singleStore(state => state.setAction);
  const setListAction = store(state => state.setAction);

  const handleCreate = () => {
    startTransition(() => {
      setAction('createOrUpdate');
    });
  };

  // React 19: Smooth role actions
  const editRole = (roleId: string) => {
    startTransition(() => {
      setAction('createOrUpdate', roleId);
    });
  };

  const deleteRole = (roleId: string) => {
    startTransition(() => {
      setListAction('delete', roleId);
    });
  };

  const viewPermissions = (roleId: string) => {
    startTransition(() => {
      setListAction('viewPermissions', { roleId });
    });
  };

  // React 19: Memoized columns for better performance
  const { columns } = useMemo(() => itemViews({ editRole, deleteRole, viewPermissions, settings }), [editRole, deleteRole, viewPermissions, settings]);

  return (
    <div className="space-y-4" data-component-id={componentId}>

      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <RoleFilters store={store} />
        <div className="flex gap-2">
          <Button
            onClick={handleCreate}
            variant="default"
            data-component-id={componentId}
          >
            <Plus /> <span className="hidden sm:inline">{buildSentence(t, 'create', 'role')}</span>
          </Button>
        </div>
      </div>

      <AppCard className="px-0">
        <TTable<IRole>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'roles', 'found')}
          showPagination={true}
        />
      </AppCard>
    </div>
  );
}

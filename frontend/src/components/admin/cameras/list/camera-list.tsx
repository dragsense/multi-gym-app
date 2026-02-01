// React & Hooks
import { useId, useTransition, useCallback, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

import { useQueryClient } from "@tanstack/react-query";
// External libraries
import { Plus } from "lucide-react";

// Types
import { type ICamera } from "@shared/interfaces/camera.interface";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { List as TList } from "@/components/list-ui/list";

// Local
import { CameraFilters } from "./camera-filters";
import { cameraItemViews } from "./camera-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TCameraListData } from "@shared/types/camera.type";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

export interface ICameraListExtraProps { }

interface ICameraListProps extends TListHandlerComponentProps<
  TListHandlerStore<ICamera, TCameraListData, ICameraListExtraProps>,
  TSingleHandlerStore<ICamera, any>
> { }

export default function CameraList({
  storeKey,
  store,
  singleStore
}: ICameraListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const queryClient = useQueryClient();

  if (!store) {
    return `${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  if (!singleStore) {
    return `${buildSentence(t, 'single', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const setAction = singleStore(state => state.setAction);
  const setListAction = store(state => state.setAction);

  // React 19: Smooth action transitions - memoized to prevent infinite loops
  const handleCreate = useCallback(() => {
    startTransition(() => {
      setAction('createOrUpdate');
    });
  }, [setAction, startTransition]);

  const handleEdit = useCallback((id: string) => {
    startTransition(() => {
      setAction('createOrUpdate', id);
    });
  }, [setAction, startTransition]);

  const handleDelete = useCallback((id: string) => {
    startTransition(() => {
      setListAction('delete', id);
    });
  }, [setListAction, startTransition]);

  const handleView = useCallback((id: string) => {
    startTransition(() => {
      setAction('view', id);
    });
  }, [setAction, startTransition]);

  const handleUpdateStatus = useCallback((id: string) => {
    startTransition(() => {
      setAction('updateStatus', id);
    });
  }, [setAction, startTransition]);

  const { listItem } = useMemo(() => cameraItemViews({
    handleEdit,
    handleDelete,
    handleView,
    handleUpdateStatus,
    componentId,
  }), [handleEdit, handleDelete, handleView, handleUpdateStatus, componentId]);

  return (
    <div data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
        <CameraFilters store={store} />
        <div className="flex items-center gap-2">
          {user?.level <= EUserLevels.ADMIN && <Button
            onClick={handleCreate}
            data-component-id={componentId}
          >
            <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'camera')}</span>
          </Button>}
        </div>
      </div>

      <div>
        <TList<ICamera>
          listStore={store}
          emptyMessage={buildSentence(t, 'no', 'cameras', 'found')}
          showPagination={true}
          renderItem={(camera) => listItem(camera, user)}
          rowClassName="grid grid-cols-1 lg:grid-cols-2 gap-4"
        />
      </div>
    </div>
  );
}

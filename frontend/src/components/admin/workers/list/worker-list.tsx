// React & Hooks
import { useId, useMemo, useTransition } from "react";
import { useUserSettings } from '@/hooks/use-user-settings';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import { type IWorker } from "@shared/interfaces/worker.interface";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { itemViews } from "./worker-item-views";
import { WorkerFilters } from "./worker-filters";

// Stores
import { type TListHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TWorkerListData } from "@shared/types";

export interface IWorkerListExtraProps {}

interface IWorkerListProps extends TListHandlerComponentProps<TListHandlerStore<IWorker, TWorkerListData, any>> {}

export default function WorkerList({
  storeKey,
  store
}: IWorkerListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  if (!store) {
    return <div>{buildSentence(t, 'list', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  // React 19: Memoized columns for better performance
  const { columns } = useMemo(() => itemViews({ store, settings }), [store, settings]);

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <WorkerFilters store={store} />
      <AppCard className="px-0">
        <TTable<IWorker>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'workers', 'found')}
          showPagination={true}
        />
      </AppCard>
    </div>
  );
}

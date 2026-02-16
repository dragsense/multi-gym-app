// React & Hooks
import { useId, useMemo, useTransition } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import { type IActivityLog } from "@shared/interfaces/activity-log.interface";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";

import { ActivityLogFilters } from "./activity-log-filters";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { itemViews } from "./activity-log-item-views";

// Stores
import { type TListHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { TActivityLogListData } from "@shared/types";





interface IActivityLogListProps extends TListHandlerComponentProps<TListHandlerStore<IActivityLog, TActivityLogListData, any>> {
}

export type ViewType = "table" | "list";


export default function ActivityLogList({
  storeKey,
  store
}: IActivityLogListProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const { t } = useI18n();

  if (!store) {
    return (`${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`);
  }

  // React 19: Memoized columns for better performance
  const { columns } = itemViews();

  return (
    <div className="space-y-2" data-component-id={componentId}>
      <ActivityLogFilters
        store={store}
      />

      <AppCard className="px-0">
        <TTable<IActivityLog>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'activity', 'logs', 'found')}
          showPagination={true}
        />
      </AppCard>
    </div>
  );
}
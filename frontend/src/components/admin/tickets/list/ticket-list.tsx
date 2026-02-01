// React & Hooks
import { useState, useId, useTransition, useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import { type ITicket } from "@shared/interfaces/ticket.interface";
import { ETicketStatus, ETicketPriority } from "@shared/enums/ticket.enum";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";

// Local
import { ticketItemViews } from "./ticket-item-views";
import { TicketFilters } from "./ticket-filters";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";
import { ADMIN_SEGMENT, ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { buildRoutePath } from "@/lib/utils";

export interface ITicketsExtraProps {
  selectedTicket?: ITicket;
}

interface ITicketListProps extends TListHandlerComponentProps<
  TListHandlerStore<ITicket, any, ITicketsExtraProps>,
  TSingleHandlerStore<ITicket, any>
> { }

type ViewType = "table" | "list";

const priorityColors = {
  [ETicketPriority.LOW]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [ETicketPriority.MEDIUM]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  [ETicketPriority.HIGH]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  [ETicketPriority.URGENT]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors = {
  [ETicketStatus.OPEN]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  [ETicketStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [ETicketStatus.PENDING]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  [ETicketStatus.RESOLVED]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  [ETicketStatus.CLOSED]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default function TicketList({
  storeKey,
  store,
  singleStore
}: ITicketListProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const { user } = useAuthUser();

  if (!store) {
    return `${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  if (!singleStore) {
    return `${buildSentence(t, 'single', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const setAction = singleStore(state => state.setAction);
  const setListAction = store(state => state.setAction);

  const { response } = store(
    useShallow((state) => ({
      response: state.response,
    }))
  );

  const [currentView, setCurrentView] = useState<ViewType>("table");

  const handleCreate = useCallback(() => {
    startTransition(() => {
      setAction('createOrUpdate');
    });
  }, [setAction, startTransition]);

  const handleEdit = useCallback((ticket: ITicket, e?: React.MouseEvent) => {
    e?.stopPropagation();
    startTransition(() => {
      setAction('createOrUpdate', ticket.id);
    });
  }, [setAction, startTransition]);

  const handleDelete = useCallback((ticketId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    startTransition(() => {
      setListAction('delete', ticketId);
    });
  }, [setListAction, startTransition]);

  const handleView = useCallback((ticket: ITicket, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    startTransition(() => {
      setAction('view', ticket.id);
    });
  }, [setAction, startTransition]);

  // Navigate to ticket detail page
  const handleSelectTicket = useCallback((ticket: ITicket) => {
    const segment = SEGMENTS[user.level];
    const detailPath = buildRoutePath(
      segment + "/" + ADMIN_ROUTES.TICKET_DETAIL.replace(":id", ticket.id)
    );
    navigate(detailPath);
  }, [navigate]);

  const handleUpdateStatus = useCallback((ticket: ITicket, e?: React.MouseEvent) => {
    e?.stopPropagation();
    startTransition(() => {
      setAction('updateStatus', ticket.id);
    });
  }, [setAction, startTransition]);

  const { columns, listItem } = ticketItemViews({
    handleEdit,
    handleDelete,
    handleView,
    handleUpdateStatus,
    priorityColors,
    statusColors,
    settings,
    componentId,
  });

  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <TicketFilters store={store} />
        <ViewToggle componentId={componentId} />
        {user?.level === EUserLevels.SUPER_ADMIN && <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'ticket')}</span>
        </Button>}
      </div>

      <TabsContent value="table">
        <TTable<ITicket>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, 'no', 'tickets', 'found')}
          showPagination={true}
          onRowClick={(ticket) => handleSelectTicket(ticket)}
          rowClassName={() => "cursor-pointer hover:bg-muted/50 transition-colors"}
        />
      </TabsContent>

      <TabsContent value="list">
        <TList<ITicket>
          listStore={store}
          emptyMessage={buildSentence(t, 'no', 'tickets', 'found')}
          showPagination={true}
          renderItem={(ticket) => listItem(
            ticket,
            false,
            handleView,
            handleDelete,
            handleEdit,
            handleUpdateStatus
          )}
        />
      </TabsContent>
    </Tabs>
  );
}

// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useMemo, useTransition } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Tag,
  AlertTriangle,
} from "lucide-react";

// Types
import { type ITicket } from "@shared/interfaces/ticket.interface";
import { ETicketStatus, ETicketPriority } from "@shared/enums/ticket.enum";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums/user.enum";
import type { IUser } from "@shared/interfaces";

export type TTicketViewExtraProps = {};

type ITicketViewProps = THandlerComponentProps<
  TSingleHandlerStore<ITicket, TTicketViewExtraProps>
>;

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

export default function TicketView({ storeKey, store }: ITicketViewProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const { user } = useAuthUser();

  const selector = useShallow(
    (state: ISingleHandlerState<ITicket, TTicketViewExtraProps>) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!storeState) {
    return null;
  }

  const { response: ticket, action, setAction, reset } = storeState;

  if (!ticket) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = (ticket: ITicket) => {
    startTransition(() => {
      setAction("createOrUpdate", ticket.id);
    });
  };

  const onDelete = (ticket: ITicket) => {
    startTransition(() => {
      setAction("delete", ticket.id);
    });
  };

  const onUpdateStatus = (ticket: ITicket) => {
    startTransition(() => {
      setAction("updateStatus", ticket.id);
    });
  };

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "ticket", "details")}
          description={buildSentence(
            t,
            "view",
            "detailed",
            "information",
            "about",
            "this",
            "ticket"
          )}
        >
          <TicketDetailContent
            ticket={ticket}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateStatus={onUpdateStatus}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface ITicketDetailContentProps {
  ticket: ITicket;
  user: IUser;
  onEdit: (ticket: ITicket) => void;
  onDelete: (ticket: ITicket) => void;
  onUpdateStatus: (ticket: ITicket) => void;
}

function TicketDetailContent({
  ticket,
  user,
  onEdit,
  onDelete,
  onUpdateStatus,
}: ITicketDetailContentProps) {
  const componentId = useId();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  const createdDate = useMemo(
    () =>
      ticket.createdAt
        ? formatDateTime(ticket.createdAt, settings)
        : "",
    [ticket.createdAt, settings]
  );

  const resolvedDate = useMemo(
    () =>
      ticket.resolvedAt
        ? formatDateTime(ticket.resolvedAt, settings)
        : null,
    [ticket.resolvedAt, settings]
  );

  const closedDate = useMemo(
    () =>
      ticket.closedAt
        ? formatDateTime(ticket.closedAt, settings)
        : null,
    [ticket.closedAt, settings]
  );

  return (
    <div className="space-y-4" data-component-id={componentId}>
      {/* Header Card */}
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">
                {ticket.title}
              </h2>
              <Badge
                variant="outline"
                className={statusColors[ticket.status]}
              >
                {ticket.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {user?.level === EUserLevels.PLATFORM_OWNER && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(ticket)}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {buildSentence(t, "update", "status")}
              </Button>
              )}
              {user?.level === EUserLevels.PLATFORM_OWNER && <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(ticket)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {buildSentence(t, "edit")}
              </Button>}
              {user?.level === EUserLevels.PLATFORM_OWNER && <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(ticket)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {buildSentence(t, "delete")}
              </Button>}
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <Badge
              variant="outline"
              className={priorityColors[ticket.priority]}
            >
              {ticket.priority}
            </Badge>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4" />
            <span>{ticket.category.replace('_', ' ')}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{createdDate}</span>
          </div>
        </div>
      </AppCard>

      {/* Ticket Details - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "ticket", "information")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "created", "by")}
                </div>
                <div className="font-medium">
                  {ticket.createdBy
                    ? `${ticket.createdBy.firstName || ''} ${ticket.createdBy.lastName || ''}`.trim() || ticket.createdBy.email
                    : "Unknown"}
                </div>
              </div>
            </div>

            {ticket.assignedTo && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "assigned", "to")}
                  </div>
                  <div className="font-medium">
                    {`${ticket.assignedTo.firstName || ''} ${ticket.assignedTo.lastName || ''}`.trim() || ticket.assignedTo.email}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "created")}
                </div>
                <div className="font-medium">{createdDate}</div>
              </div>
            </div>

            {resolvedDate && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "resolved")}
                  </div>
                  <div className="font-medium">{resolvedDate}</div>
                </div>
              </div>
            )}

            {closedDate && (
              <div className="flex items-center gap-3">
                <XCircle className="w-4 h-4 text-gray-600 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "closed")}
                  </div>
                  <div className="font-medium">{closedDate}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "status", "details")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("status")}
                </div>
                <Badge
                  variant="outline"
                  className={statusColors[ticket.status]}
                >
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("priority")}
                </div>
                <Badge
                  variant="outline"
                  className={priorityColors[ticket.priority]}
                >
                  {ticket.priority}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("category")}
                </div>
                <div className="font-medium capitalize">
                  {ticket.category.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("description")}
          </h3>
          <div className="border rounded-md p-3 bg-muted/30">
            <div
              className="text-sm text-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: ticket.description || "" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


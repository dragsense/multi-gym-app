// React
import { useId, useTransition } from "react";
import { useShallow } from "zustand/shallow";
import { useNavigate } from "react-router-dom";

// Types
import type { ITicket } from "@shared/interfaces/ticket.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { ETicketStatus, ETicketPriority } from "@shared/enums/ticket.enum";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, RefreshCw, User, Calendar, Tag, AlertCircle } from "lucide-react";

// Page Components
import { TicketRepliesHandler } from "./ticket-replies-handler";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { buildSentence } from "@/locales/translations";
import { formatDateTime, buildRoutePath } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth-user";

// Config
import { ADMIN_SEGMENT, ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { EUserLevels } from "@shared/enums/user.enum";

const priorityColors = {
  [ETicketPriority.LOW]: "bg-blue-100 text-blue-800 border-blue-200",
  [ETicketPriority.MEDIUM]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [ETicketPriority.HIGH]: "bg-orange-100 text-orange-800 border-orange-200",
  [ETicketPriority.URGENT]: "bg-red-100 text-red-800 border-red-200",
};

const statusColors = {
  [ETicketStatus.OPEN]: "bg-green-100 text-green-800 border-green-200",
  [ETicketStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 border-blue-200",
  [ETicketStatus.PENDING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [ETicketStatus.RESOLVED]: "bg-purple-100 text-purple-800 border-purple-200",
  [ETicketStatus.CLOSED]: "bg-gray-100 text-gray-800 border-gray-200",
};

interface ITicketDetailContentProps
  extends THandlerComponentProps<TSingleHandlerStore<ITicket, any>> {}

export function TicketDetailContent({ storeKey, store }: ITicketDetailContentProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const { user } = useAuthUser();

  if (!store) {
    return null;
  }

  const { response: ticket, setAction } = store(
    useShallow((state) => ({
      response: state.response,
      setAction: state.setAction,
    }))
  );

  if (!ticket) {
    return null;
  }

  const handleBack = () => {
    const segment = SEGMENTS[user.level]; 
    navigate(buildRoutePath(segment + "/" + ADMIN_ROUTES.TICKETS));
  };

  const handleEdit = () => {
    startTransition(() => {
      setAction("createOrUpdate", ticket.id);
    });
  };

  const handleUpdateStatus = () => {
    startTransition(() => {
      setAction("updateStatus", ticket.id);
    });
  };

  const createdDate = ticket.createdAt
    ? formatDateTime(ticket.createdAt, settings)
    : "";

  return (
    <div data-component-id={componentId} className="space-y-3">
      {/* Header with Back Button and Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {buildSentence(t, "back", "to", "tickets")}
        </Button>
        <div className="flex items-center gap-2">
          {user?.level === EUserLevels.PLATFORM_OWNER && <Button variant="outline" size="sm" onClick={handleUpdateStatus} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {buildSentence(t, "update", "status")}
          </Button>}
          {user?.level === EUserLevels.PLATFORM_OWNER && <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
            <Pencil className="w-4 h-4" />
            {buildSentence(t, "edit")}
          </Button>}
        </div>
      </div>

      {/* Ticket Info Card */}
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold mb-2">{ticket.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={statusColors[ticket.status]}>
                  {ticket.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className={priorityColors[ticket.priority]}>
                  {ticket.priority}
                </Badge>
                <Badge variant="outline">{ticket.category.replace("_", " ")}</Badge>
              </div>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Details */}
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
                    {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ticket.createdBy?.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "created", "at")}
                  </div>
                  <div className="font-medium">{createdDate}</div>
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
                      {ticket.assignedTo?.firstName} {ticket.assignedTo?.lastName}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Priority & Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {buildSentence(t, "status", "information")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("priority")}</div>
                  <Badge variant="outline" className={priorityColors[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("category")}</div>
                  <Badge variant="outline">{ticket.category.replace("_", " ")}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {ticket.description && (
          <div className="pt-4 border-t mt-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {t("description")}
            </h3>
            <div
              className="text-sm text-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: ticket.description }}
            />
          </div>
        )}
      </AppCard>

      {/* Replies Section */}
      <AppCard
        header={
          <h2 className="text-lg font-semibold">{buildSentence(t, "replies")}</h2>
        }
        className="min-h-[400px]"
      >
        <TicketRepliesHandler selectedTicket={ticket as any} storeKey={storeKey} />
      </AppCard>
    </div>
  );
}

import { useId } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  Edit,
  Trash2,
  Eye,
  Repeat,
  FileText,
} from "lucide-react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import { type ISession } from "@shared/interfaces/session.interface";
import { ESessionStatus, getSessionStatusColor } from "@shared/enums/session.enum";
import { EScheduleFrequency } from "@shared/enums/schedule.enum";
import type { ColumnDef } from "@tanstack/react-table";
import type { IUserSettings } from "@shared/interfaces/settings.interface";

// Utils
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums/user.enum";
import type { IUser } from "@shared/interfaces";

interface ISessionItemViewsProps {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  handleEditNotes: (id: string) => void;
  settings?: IUserSettings;
  componentId?: string;
  t: (key: string) => string;
}

export function sessionItemViews({
  handleEdit,
  handleDelete,
  handleView,
  handleEditNotes,
  settings,
  componentId = "session-item-views",
  t,
}: ISessionItemViewsProps) {

  const { user } = useAuthUser();

  // Table columns
  const columns: ColumnDef<ISession>[] = [
    {
      accessorKey: "title",
      header: t("title"),
      cell: ({ row }) => (
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium max-w-xs text-wrap">{row.original.title}</p>
        </div>
      ),
    },
    {
      accessorKey: "trainer",
      header: t("trainer"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>
            {row.original.trainer?.user?.firstName}{" "}
            {row.original.trainer?.user?.lastName}
          </span>
        </div>
      ),
    },
    {
      id: "membersCount",
      header: t("members"),
      cell: ({ row }) => <span>{row.original.membersCount}</span>,
    },
    {
      id: "startDateTime",
      header: buildSentence(t, "start", "time"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatDateTime(row.original.startDateTime, settings)}</span>
        </div>
      ),
    },
    {
      id: "duration",
      header: t("duration"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {row.original.duration} {t("minutes")}
          </span>
        </div>
      ),
    },
    {
      id: "type",
      header: t("type"),
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
    },
    {
      id: "status",
      header: t("status"),
      cell: ({ row }) => {
        const session = row.original;
        return (
          <Badge className={getSessionStatusColor(session.status, "badge")}>
            {session.status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "price",
      header: t("price"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>
            {row.original.price
              ? formatCurrency(
                row.original.price,
                undefined,
                undefined,
                2,
                2,
                settings
              )
              : t("free")}
          </span>
        </div>
      ),
    },
    {
      id: "recurrence",
      header: t("recurrence"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Repeat
            className={`h-4 w-4 ${row.original.enableRecurrence
              ? "text-blue-600"
              : "text-muted-foreground"
              }`}
          />
          <Badge
            variant={row.original.enableRecurrence ? "default" : "outline"}
          >
            {row.original.enableRecurrence ? t("yes") : t("no")}
          </Badge>
        </div>
      ),
    },
    // add field for frequency reucrrenceConfig.frequency
    {
      id: "recurrenceConfig",
      header: t("frequency"),
      cell: ({ row }) => {
        const recurrenceConfig = row.original.recurrenceConfig;
        const frequency = recurrenceConfig?.frequency || EScheduleFrequency.ONCE;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{frequency.charAt(0).toUpperCase() + frequency.slice(1)}</Badge>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditNotes(row.original.id)}
              data-component-id={componentId}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {buildSentence(t,"notes")}
          </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(row.original.id)}
            data-component-id={componentId}
          >
            <Eye className="h-4 w-4" />
          </Button>
          </TooltipTrigger>
          <TooltipContent>
            {buildSentence(t,"details")}
          </TooltipContent>
          </Tooltip>

          {user?.level <= EUserLevels.STAFF && <><Tooltip>
          <TooltipTrigger asChild>
         <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original.id)}
            data-component-id={componentId}
          >
            <Edit className="h-4 w-4" />
          </Button>
          </TooltipTrigger>
          <TooltipContent>
            {buildSentence(t,"edit")}
          </TooltipContent>
          </Tooltip>

          <Tooltip>
          <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            data-component-id={componentId}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          </TooltipTrigger>
          <TooltipContent>
            {buildSentence(t,"delete")}
          </TooltipContent>
          </Tooltip></>}
        </div>
      ),
    },
  ];

  // List item renderer
  const listItem = (session: ISession, currentUser: IUser) => (
    <AppCard
      className="p-4 hover:shadow-md transition-shadow"
      data-component-id={componentId}
    >
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">{session.title}</h3>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline">{session.type}</Badge>
            <Badge
              className={
                session.status === ESessionStatus.SCHEDULED
                  ? "bg-blue-100 text-blue-800"
                  : session.status === ESessionStatus.IN_PROGRESS
                    ? "bg-yellow-100 text-yellow-800"
                    : session.status === ESessionStatus.COMPLETED
                      ? "bg-green-100 text-green-800"
                      : session.status === ESessionStatus.CANCELLED
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
              }
            >
              {session.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                <strong>{t("trainer")}:</strong>{" "}
                {session.trainer?.user?.firstName} {session.trainer?.user?.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                <strong>{t("members")}:</strong> {session.membersCount}{" "}
                {t("members")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                <strong>{t("start")}:</strong>{" "}
                {formatDateTime(session.startDateTime, settings)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                <strong>{t("duration")}:</strong> {session.duration}{" "}
                {t("minutes")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                <strong>{t("end")}:</strong>{" "}
                {formatDateTime(session.endDateTime, settings)}
              </span>
            </div>
            {session.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  <strong>{t("location")}:</strong> {session.location}
                </span>
              </div>
            )}
            {session.price && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>
                  <strong>{t("price")}:</strong>{" "}
                  {formatCurrency(
                    session.price,
                    undefined,
                    undefined,
                    2,
                    2,
                    settings
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Repeat
                className={`h-4 w-4 ${session.enableRecurrence
                  ? "text-blue-600"
                  : "text-muted-foreground"
                  }`}
              />
              <span>
                <strong>{t("recurrence")}:</strong>{" "}
                {session.enableRecurrence ? t("yes") : t("no")}
              </span>
            </div>
          </div>
          {session.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {session.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditNotes(session.id)}
                data-component-id={componentId}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Notes
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(session.id)}
            data-component-id={componentId}
          >
            <Eye className="h-4 w-4" />
          </Button>
          </TooltipTrigger>
          <TooltipContent>
            {buildSentence(t,"details")}
          </TooltipContent>
          </Tooltip>


          {currentUser?.id === session.trainer?.user?.id && <><Tooltip>
          <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(session.id)}
            data-component-id={componentId}
          >
            <Edit className="h-4 w-4" />
          </Button>
          </TooltipTrigger>
          <TooltipContent>
            {buildSentence(t,"edit")}
          </TooltipContent>
          </Tooltip>



          <Tooltip>
          <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(session.id)}
            data-component-id={componentId}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          </TooltipTrigger>
          <TooltipContent>
            {buildSentence(t,"delete")}
          </TooltipContent>
          </Tooltip></>}


          
        </div>
      </div>
    </AppCard>
  );

  return { columns, listItem };
}

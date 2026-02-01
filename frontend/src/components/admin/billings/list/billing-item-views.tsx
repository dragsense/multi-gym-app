import {
  Calendar,
  Clock,
  DollarSign,
  User,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CreditCard,
  Mail,
  FileText,
  Banknote,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import { type IBilling } from "@shared/interfaces/billing.interface";
import { EBillingStatus } from "@shared/enums/billing.enum";
import type { ColumnDef } from "@tanstack/react-table";
import type { IUserSettings } from "@shared/interfaces/settings.interface";

// Utils
import { formatDate, formatCurrency } from "@shared/lib/format.utils";
import { buildSentence } from "@/locales/translations";


import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";
import type { IUser } from "@shared/interfaces/user.interface";

interface IBillingItemViewsProps {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  handlePayment?: (id: string) => void;
  handleSendEmail?: (id: string) => void;
  handleInvoice?: (id: string) => void;
  handleCashPayment?: (id: string) => void;
  settings?: IUserSettings;
  componentId?: string;
  t: (key: string) => string;
}

export function billingItemViews({
  handleEdit,
  handleDelete,
  handleView,
  handlePayment,
  handleSendEmail,
  handleInvoice,
  handleCashPayment,
  settings,
  componentId = "billing-item-views",
  t,
}: IBillingItemViewsProps) {

  const { user } = useAuthUser();

  // Table columns
  const columns: ColumnDef<IBilling>[] = [
    {
      accessorKey: "title",
      header: t("title"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: t("amount"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium">
            {formatCurrency(
              row.original.amount,
              undefined,
              undefined,
              2,
              2,
              settings
            )}
          </span>
        </div>
      ),
    },
    {
      id: "type",
      header: t("type"),
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type.toLowerCase()}
        </Badge>
      ),
    },
    {
      id: "issueDate",
      header: buildSentence(t, "issue", "date"),
      cell: ({ row }) => {
        const billing = row.original;

        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(billing.issueDate, settings)}</span>
          </div>
        );
      },
    },
    {
      id: "dueDate",
      header: buildSentence(t, "due", "date"),
      cell: ({ row }) => {
        const billing = row.original;
        const isOverdue =
          new Date(billing.dueDate) < new Date() &&
          billing.status === EBillingStatus.PENDING;

        return (
          <div
            className={`flex items-center gap-1 ${isOverdue ? "text-red-600" : ""
              }`}
          >
            <Calendar className="h-4 w-4" />
            <span>{formatDate(billing.dueDate, settings)}</span>
            {isOverdue && <AlertCircle className="h-4 w-4" />}
          </div>
        );
      },
    },
    {
      accessorKey: "recipientUser",
      header: t("recipient"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>
            {row.original.recipientUser?.firstName}{" "}
            {row.original.recipientUser?.lastName}
          </span>
        </div>
      ),
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
                onClick={() => handleView(row.original.id)}
                data-component-id={componentId}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {buildSentence(t, "details")}
            </TooltipContent>
          </Tooltip>

          {user?.level <= EUserLevels.ADMIN && <Tooltip>
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
              {buildSentence(t, "edit")}
            </TooltipContent>
          </Tooltip>}



          {handlePayment && user?.id === row.original.recipientUser?.id && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePayment(row.original.id)}
                  data-component-id={componentId}
                  className="text-green-600 hover:text-green-700"
                >
                  <CreditCard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {buildSentence(t, "payment")}
              </TooltipContent>
            </Tooltip>
          )}
          {handleSendEmail && user?.level <= EUserLevels.ADMIN && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSendEmail(row.original.id)}
                  data-component-id={componentId}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {buildSentence(t, "send", "email")}
              </TooltipContent>
            </Tooltip>
          )}
          {handleInvoice && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInvoice(row.original.id)}
                  data-component-id={componentId}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {buildSentence(t, "invoice")}
              </TooltipContent>
            </Tooltip>
          )}
          {handleCashPayment && row.original.isCashable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCashPayment(row.original.id)}
              data-component-id={componentId}
              className="text-amber-600 hover:text-amber-700"
              title={t("mark_as_paid")}
            >
              <Banknote className="h-4 w-4" />
            </Button>
          )}
          {user?.level <= EUserLevels.ADMIN && <Tooltip>
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
              {buildSentence(t, "delete")}
            </TooltipContent>
          </Tooltip>}
        </div>
      ),
    },
  ];

  // List item renderer
  const listItem = (billing: IBilling, currentUser: IUser) => {
    const isOwner = billing.recipientUser?.id === currentUser.id;


    const isOverdue =
      new Date(billing.dueDate) < new Date() &&
      billing.status === EBillingStatus.PENDING;
    const statusColors = {
      [EBillingStatus.PENDING]: "bg-yellow-100 text-yellow-800",
      [EBillingStatus.PAID]: "bg-green-100 text-green-800",
      [EBillingStatus.OVERDUE]: "bg-red-100 text-red-800",
      [EBillingStatus.CANCELLED]: "bg-gray-100 text-gray-800",
      [EBillingStatus.REFUNDED]: "bg-blue-100 text-blue-800",
    };

    return (
      <AppCard
        className="p-4 hover:shadow-md transition-shadow"
        data-component-id={componentId}
      >
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">{billing.title}</h3>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="capitalize">
                {billing.type.toLowerCase()}
              </Badge>
              <Badge
                className={
                  billing.status
                    ? statusColors[billing.status] ||
                    "bg-gray-100 text-gray-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {billing.status
                  ? billing.status.replace("_", " ")
                  : t("not_available")}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>
                  <strong>{t("amount")}:</strong>{" "}
                  {formatCurrency(
                    billing.amount,
                    undefined,
                    undefined,
                    2,
                    2,
                    settings
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  <strong>{t("recipient")}:</strong>{" "}
                  {billing.recipientUser?.firstName}{" "}
                  {billing.recipientUser?.lastName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  <strong>{buildSentence(t, "issue", "date")}:</strong>{" "}
                  {formatDate(billing.issueDate, settings)}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 ${isOverdue ? "text-red-600" : ""
                  }`}
              >
                <Calendar className="h-4 w-4" />
                <span>
                  <strong>{buildSentence(t, "due", "date")}:</strong>{" "}
                  {formatDate(billing.dueDate, settings)}
                </span>
                {isOverdue && <AlertCircle className="h-4 w-4" />}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  <strong>{t("recurrence")}:</strong> {billing.recurrence}
                </span>
              </div>
            </div>

            {billing.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {billing.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(billing.id)}
                  data-component-id={componentId}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {buildSentence(t, "view")}
              </TooltipContent>
            </Tooltip>


            {user?.level <= EUserLevels.ADMIN && <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(billing.id)}
                  data-component-id={componentId}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {buildSentence(t, "edit")}
              </TooltipContent>
            </Tooltip>}


            {user?.level <= EUserLevels.ADMIN && <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(billing.id)}
                  data-component-id={componentId}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

              </TooltipTrigger>
              <TooltipContent>
                {buildSentence(t, "delete")}
              </TooltipContent>
            </Tooltip>}

          </div>
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
}

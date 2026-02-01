// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useMemo, useTransition, useState } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  FileText,
  Repeat,
  Bell,
  Pencil,
  Trash2,
  CreditCard,
  Mail,
} from "lucide-react";

// Types
import { type IBilling } from "@shared/interfaces/billing.interface";
import { EBillingStatus } from "@shared/enums/billing.enum";
import { EScheduleFrequency } from "@shared/enums/schedule.enum";
import {
  EReminderSendBefore,
  EReminderType,
} from "@shared/enums/reminder.enum";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";

type IBillingViewProps = THandlerComponentProps<
  TSingleHandlerStore<IBilling, any>
>;

export default function BillingView({ storeKey, store }: IBillingViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow((state: ISingleHandlerState<IBilling, any>) => ({
    response: state.response,
    action: state.action,
    setAction: state.setAction,
    reset: state.reset,
  }));

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

  const { response: billing, action, setAction, reset } = storeState;

  if (!billing) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = (billing: IBilling) => {
    startTransition(() => {
      setAction("createOrUpdate", billing.id);
    });
  };

  const onDelete = (billing: IBilling) => {
    startTransition(() => {
      setAction("delete", billing.id);
    });
  };

  const onPayNow = (billing: IBilling) => {
    startTransition(() => {
      setAction("pay", billing.id);
    });
  };

  const onEditNotes = (billing: IBilling) => {
    startTransition(() => {
      setAction("notes", billing.id);
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
          title={buildSentence(t, "billing", "details")}
          description={buildSentence(
            t,
            "view",
            "detailed",
            "information",
            "about",
            "this",
            "billing"
          )}
        >
          <BillingDetailContent
            billing={billing}
            onEdit={onEdit}
            onDelete={onDelete}
            onPayNow={onPayNow}
            onEditNotes={onEditNotes}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface IBillingDetailContentProps {
  billing: IBilling;
  onEdit: (billing: IBilling) => void;
  onDelete: (billing: IBilling) => void;
  onPayNow: (billing: IBilling) => void;
  onEditNotes: (billing: IBilling) => void;
}

function BillingDetailContent({
  billing,
  onEdit,
  onDelete,
  onPayNow,
  onEditNotes,
}: IBillingDetailContentProps) {
  // React 19: Essential IDs
  const componentId = useId();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  // React 19: Memoized date formatting for better performance
  const issueDate = useMemo(
    () => (billing.issueDate ? formatDate(billing.issueDate, settings) : ""),
    [billing.issueDate, settings]
  );

  const dueDate = useMemo(
    () => (billing.dueDate ? formatDate(billing.dueDate, settings) : ""),
    [billing.dueDate, settings]
  );

  // Calculate subtotal from line items or use billing amount
  const subtotal = useMemo(() => {
    if (billing.lineItems && billing.lineItems.length > 0) {
      return billing.lineItems.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      );
    }
    return billing.amount || 0;
  }, [billing.lineItems, billing.amount]);

  // Get tax rate from settings
  const taxRate = settings?.billing?.taxRate || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  // React 19: Memoized status configuration
  const statusConfig = useMemo(
    () => ({
      [EBillingStatus.PENDING]: {
        variant: "secondary" as const,
        label: t("pending"),
        color: "text-yellow-600",
      },
      [EBillingStatus.PAID]: {
        variant: "default" as const,
        label: t("paid"),
        color: "text-green-600",
      },
      [EBillingStatus.OVERDUE]: {
        variant: "destructive" as const,
        label: t("overdue"),
        color: "text-red-600",
      },
      [EBillingStatus.CANCELLED]: {
        variant: "outline" as const,
        label: t("cancel"),
        color: "text-gray-600",
      },
      [EBillingStatus.REFUNDED]: {
        variant: "outline" as const,
        label: t("overdue"),
        color: "text-blue-600",
      },
    }),
    [t]
  );

  const status = statusConfig[billing.status] || {
    variant: "secondary" as const,
    label: billing.status,
    color: "text-gray-600",
  };
  const isOverdue =
    new Date(billing.dueDate) < new Date() &&
    billing.status === EBillingStatus.PENDING;

  const getBillingStatusColor = (status: EBillingStatus) => {
    const colors: Record<EBillingStatus, string> = {
      [EBillingStatus.PENDING]:
        "bg-yellow-100 text-yellow-800 border-yellow-200",
      [EBillingStatus.PAID]: "bg-green-100 text-green-800 border-green-200",
      [EBillingStatus.OVERDUE]: "bg-red-100 text-red-800 border-red-200",
      [EBillingStatus.CANCELLED]: "bg-gray-100 text-gray-800 border-gray-200",
      [EBillingStatus.REFUNDED]: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">
                {billing.title}
              </h2>
              <Badge
                variant="outline"
                className={getBillingStatusColor(billing.status)}
              >
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(billing)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {buildSentence(t, "edit")}
              </Button>
              {billing.status === EBillingStatus.PENDING && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onPayNow(billing)}
                  className="gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {buildSentence(t, "pay", "now")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(billing)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {buildSentence(t, "delete")}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            {billing.type} {t("billing")}
          </span>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold text-foreground">
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
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{dueDate}</span>
          </div>
        </div>
      </AppCard>

      {/* Billing Details and Recipient - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "billing", "information")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "subtotal")}
                </div>
                <div className="font-medium text-lg text-green-600">
                  {formatCurrency(
                    subtotal,
                    undefined,
                    undefined,
                    2,
                    2,
                    settings
                  )}
                </div>
              </div>
            </div>
            {taxRate > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("tax")} ({taxRate}%)
                    </div>
                    <div className="font-medium">
                      {formatCurrency(
                        taxAmount,
                        undefined,
                        undefined,
                        2,
                        2,
                        settings
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("total")}
                    </div>
                    <div className="font-medium text-lg text-green-600">
                      {formatCurrency(
                        totalAmount,
                        undefined,
                        undefined,
                        2,
                        2,
                        settings
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "issue", "date")}
                </div>
                <div className="font-medium">{issueDate}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "due", "date")}
                </div>
                <div
                  className={`font-medium ${isOverdue ? "text-red-600" : ""}`}
                >
                  {dueDate}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("type")}</div>
                <div className="font-medium capitalize">{billing.type}</div>
              </div>
            </div>
            {billing.description && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("description")}
                  </div>
                  <div className="text-sm">{billing.description}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("recipient")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("name")}</div>
                <div className="font-medium">
                  {billing.recipientUser?.firstName}{" "}
                  {billing.recipientUser?.lastName}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("email")}
                </div>
                <div className="font-medium">
                  {billing.recipientUser?.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      {billing.lineItems && billing.lineItems.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "line", "items")} ({billing.lineItems.length})
          </h3>
          <div className="space-y-3">
            {billing.lineItems.map((item, index) => {
              const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
              return (
                <div
                  key={item.id || index}
                  className="flex items-center justify-between gap-4 hover:bg-muted p-3 rounded-md border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.description || "-"}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("quantity")}: {item.quantity || 0} ×{" "}
                      {formatCurrency(
                        item.unitPrice || 0,
                        undefined,
                        undefined,
                        2,
                        2,
                        settings
                      )}
                    </div>
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(
                      itemTotal,
                      undefined,
                      undefined,
                      2,
                      2,
                      settings
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recurrence */}
      {billing.recurrence && billing.recurrence !== EScheduleFrequency.ONCE && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("recurrence")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Repeat className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "frequency")}
                </div>
                <div className="font-medium capitalize">
                  {billing.recurrence || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminders */}
      {billing.enableReminders && billing.reminderConfig && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("reminders")}
          </h3>
          <div className="space-y-3">
            {billing.reminderConfig.sendBefore &&
              billing.reminderConfig.sendBefore.length > 0 && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      {buildSentence(t, "send", "before")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {billing.reminderConfig.sendBefore.map(
                        (minutes: EReminderSendBefore) => {
                          const sendBeforeLabels: Record<
                            EReminderSendBefore,
                            string
                          > = {
                            [EReminderSendBefore.ONE_MINUTE]: "1 Minute",
                            [EReminderSendBefore.TEN_MINUTES]: "10 Minutes",
                            [EReminderSendBefore.THIRTY_MINUTES]: "30 Minutes",
                            [EReminderSendBefore.ONE_HOUR]: "1 Hour",
                            [EReminderSendBefore.THREE_HOURS]: "3 Hours",
                            [EReminderSendBefore.ONE_DAY]: "1 Day",
                            [EReminderSendBefore.THREE_DAYS]: "3 Days",
                          };
                          return (
                            <Badge
                              key={minutes}
                              variant="outline"
                              className="text-xs"
                            >
                              {sendBeforeLabels[minutes] ||
                                `${minutes} minutes`}
                            </Badge>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              )}
            {billing.reminderConfig.reminderTypes &&
              billing.reminderConfig.reminderTypes.length > 0 && (
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      {buildSentence(t, "reminder", "types")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {billing.reminderConfig.reminderTypes.map(
                        (type: EReminderType) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {type.toLowerCase()}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "notes")}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditNotes(billing)}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
        <NotesView notes={billing.notes} t={t} />
      </div>
    </div>
  );
}

// Notes Component with View/Hide Toggle
function NotesView({
  notes,
  t,
}: {
  notes?: string;
  t: (key: string) => string;
}) {
  const [showFull, setShowFull] = useState(false);
  const maxLength = 200; // Character limit before showing "read more"
  const shouldTruncate = notes && notes.length > maxLength;
  const displayText =
    showFull || !shouldTruncate ? notes : notes.substring(0, maxLength) + "...";

  return (
    <div className="space-y-2">
      <div className="border rounded-md p-3 bg-muted/30">
        <p className="text-sm whitespace-pre-wrap text-foreground">
          {displayText || buildSentence(t, "no", "notes")}
        </p>
        {shouldTruncate && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setShowFull(!showFull)}
            className="mt-2 h-auto p-0 text-xs"
          >
            {showFull
              ? buildSentence(t, "read", "less")
              : buildSentence(t, "read", "more")}
          </Button>
        )}
      </div>
    </div>
  );
}

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
  MapPin,
  DollarSign,
  User,
  Target,
  FileText,
  Repeat,
  Bell,
  Pencil,
  Trash2,
  X,
  Mail,
  RotateCcw,
  Check,
  CreditCard,
  Globe,
} from "lucide-react";

// Types
import { type ISession } from "@shared/interfaces/session.interface";
import {
  getSessionStatusColor,
  EUpdateSessionScope,
  ESessionStatus,
} from "@shared/enums/session.enum";
import { EScheduleFrequency, EDayOfWeek } from "@shared/enums/schedule.enum";
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
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
} from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence, concat } from "@/locales/translations";
import { Button } from "@/components/ui/button";
import { UserAvailability } from "./user-availability";
import { SessionPaymentStatus } from "./session-payment-status";
import { SessionUpdateScopeModal } from "../components/session-update-scope-modal";
import { AppCard } from "@/components/layout-ui/app-card";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { IUser } from "@shared/interfaces";
import { EUserLevels } from "@shared/enums";



type ISessionViewProps = THandlerComponentProps<
  TSingleHandlerStore<ISession, any>
>;

export default function SessionView({ storeKey, store }: ISessionViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const { user } = useAuthUser();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<ISession, TSessionViewExtraProps>) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      setExtra: state.setExtra,
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

  const { response: session, action, setAction, setExtra, reset } = storeState;

  if (!session) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = (session: ISession) => {
    startTransition(() => {
      setAction("createOrUpdate", session.id);
    });
  };

  const onDelete = (session: ISession, scope?: EUpdateSessionScope) => {
    startTransition(() => {
      if (scope) {
        setExtra("scope", scope);
      }
      setAction("delete", session.id);
    });
  };

  const onCancel = (session: ISession) => {
    startTransition(() => {
      setAction("cancel", session.id);
    });
  };

  const onReactivate = (session: ISession) => {
    startTransition(() => {
      setAction("reactivate", session.id);
    });
  };

  const onComplete = (session: ISession) => {
    startTransition(() => {
      setAction("complete", session.id);
    });
  };

  const onPayNow = (session: ISession, memberId: string) => {
    startTransition(() => {
      setExtra("memberId", memberId);
      setAction("pay", session.id);
    });
  };

  const onEditNotes = (session: ISession, updateScope: EUpdateSessionScope) => {
    startTransition(() => {
      setExtra("updateScope", updateScope);
      setAction("notes", session.id);
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
          title={buildSentence(t, "session", "details")}
          description={buildSentence(
            t,
            "view detailed information about this session"
          )}
        >
          <SessionDetailContent
            session={session}
            onEdit={onEdit}
            onDelete={onDelete}
            onCancel={onCancel}
            onComplete={onComplete}
            onReactivate={onReactivate}
            onPayNow={onPayNow}
            onEditNotes={onEditNotes}
            currentUser={user}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface ISessionDetailContentProps {
  session: ISession;
  onEdit: (session: ISession) => void;
  onDelete: (session: ISession, scope?: EUpdateSessionScope) => void;
  onCancel: (session: ISession) => void;
  onComplete: (session: ISession) => void;
  onReactivate: (session: ISession) => void;
  onPayNow: (session: ISession, memberId: string) => void;
  onEditNotes: (session: ISession, updateScope: EUpdateSessionScope) => void;
  currentUser: IUser;
}

function SessionDetailContent({
  session,
  onEdit,
  onDelete,
  onCancel,
  onComplete,
  onReactivate,
  onPayNow,
  onEditNotes,
  currentUser,
}: ISessionDetailContentProps) {
  // React 19: Essential IDs
  const componentId = useId();
  const { settings } = useUserSettings();
  const { t } = useI18n();
  const [showDeleteScopeModal, setShowDeleteScopeModal] = useState(false);

  const handleDeleteClick = () => {
    if (
      session.recurrenceConfig?.frequency &&
      session.recurrenceConfig?.frequency !== EScheduleFrequency.ONCE
    ) {
      setShowDeleteScopeModal(true);
    } else {
      onDelete(session);
    }
  };

  const handleDeleteScopeSelect = (scope: EUpdateSessionScope) => {
    onDelete(session, scope);
    setShowDeleteScopeModal(false);
  };

  const handleCancelClick = () => {
    onCancel(session);
  };

  const trainer = session.trainer;
  const trainerUser = trainer?.user;
  const membersUsers = session.members?.map((c) => c.user) ?? [];

  const canMarkComplete = useMemo(() => {
    const sessionStartTime = new Date(session.startDateTime);
    const now = new Date();
    return (
      now >= sessionStartTime && session.status !== ESessionStatus.COMPLETED
    );
  }, [session.startDateTime, session.status]);

  // React 19: Memoized session dates for better performance
  const sessionStartDate = useMemo(
    () =>
      session.startDateTime ? formatDate(session.startDateTime, settings) : "",
    [session.startDateTime, settings]
  );

  const sessionStartTime = useMemo(
    () =>
      session.startDateTime ? formatTime(session.startDateTime, settings) : "",
    [session.startDateTime, settings]
  );

  const sessionEndStartDate = useMemo(
    () =>
      session.endDateTime ? formatDate(session.endDateTime, settings) : "",
    [session.endDateTime, settings]
  );

  const sessionEndTime = useMemo(
    () =>
      session.endDateTime ? formatTime(session.endDateTime, settings) : "",
    [session.endDateTime, settings]
  );

  // Get timezone for display
  const timezone = useMemo(
    () =>
      settings?.time?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    [settings?.time?.timezone]
  );

  // Format timezone label (e.g., "America/New_York" -> "EST (America/New_York)")
  const timezoneLabel = useMemo(() => {
    if (!timezone) return "";
    try {
      const now = new Date();
      const tzName = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "short",
      })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value;

      // Extract city name from timezone (e.g., "America/New_York" -> "New York")
      const cityName =
        timezone.split("/").pop()?.replace(/_/g, " ") || timezone;
      return tzName ? `${tzName} (${cityName})` : cityName;
    } catch {
      return timezone;
    }
  }, [timezone]);

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">
                {session.title}
              </h2>
              {/* Compute if session is in progress */}
              {(() => {
                const now = new Date();
                const start = session.startDateTime
                  ? new Date(session.startDateTime)
                  : null;
                const end = session.endDateTime
                  ? new Date(session.endDateTime)
                  : null;
                let statusToShow = session.status;
                if (
                  start &&
                  end &&
                  now >= start &&
                  now < end &&
                  session.status !== ESessionStatus.CANCELLED &&
                  session.status !== ESessionStatus.COMPLETED
                ) {
                  statusToShow = ESessionStatus.IN_PROGRESS;
                } else if (
                  end &&
                  now >= end &&
                  statusToShow !== ESessionStatus.CANCELLED &&
                  statusToShow !== ESessionStatus.COMPLETED
                ) {
                  statusToShow = ESessionStatus.PASSED;
                }
                return (
                  <Badge
                    variant="outline"
                    className={getSessionStatusColor(statusToShow, "badge")}
                  >
                    {statusToShow.replace(/_/g, " ")}
                  </Badge>
                );
              })()}
            </div>
            {currentUser?.level <= EUserLevels.STAFF && <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(session)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {buildSentence(t, "edit")}
              </Button>

              {canMarkComplete && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onComplete(session)}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  {buildSentence(t, "mark", "as", "completed")}
                </Button>
              )}
              {session.status === ESessionStatus.CANCELLED &&
                new Date(session.startDateTime) > new Date() ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReactivate(session)}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {buildSentence(t, "reactivate")}
                </Button>
              ) : (
                session.status !== ESessionStatus.CANCELLED && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelClick}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    {buildSentence(t, "cancel")}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {buildSentence(t, "delete")}
              </Button>
            </div>}
          </div>
        }
      >
  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
    <span>
      {session.type} {t("session")}
    </span>
    <span>•</span>
    <div className="flex items-center gap-1.5">
      <Clock className="w-4 h-4" />
      <span>
        {sessionStartDate} at {sessionStartTime}
      </span>
    </div>
    <span>•</span>
    <span>
      {session.duration} {t("minutes")}
    </span>
    <span>•</span>
    <div className="flex items-center gap-1.5">
      <Globe className="w-4 h-4" />
      <span>{timezoneLabel}</span>
    </div>
  </div>
      </AppCard >
  {/* Header */ }

{/* Session Details */ }
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="space-y-4">
    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
      {buildSentence(t, "session", "information")}
    </h3>
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
        <div>
          <div className="text-xs text-muted-foreground">
            {buildSentence(t, "start", "time")}
          </div>
          <div className="font-medium">
            {sessionStartDate} at {sessionStartTime}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
        <div>
          <div className="text-xs text-muted-foreground">
            {buildSentence(t, "end", "time")}
          </div>
          <div className="font-medium">
            {sessionEndStartDate} at {sessionEndTime}
          </div>
        </div>
      </div>
      {session.location && (
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">
              {t("location")}
            </div>
            <div className="font-medium">
              {typeof session.location === 'string'
                ? session.location
                : session.location.name || session.location.address || t("location")}
            </div>
            {typeof session.location === 'object' && session.location.address && (
              <div className="text-xs text-muted-foreground mt-1">
                {session.location.address}
              </div>
            )}
          </div>
        </div>
      )}
   
      {session.price && (
        <div className="flex items-center gap-3">
          <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">
              {t("price")}
            </div>
            <div className="font-medium">
              {formatCurrency(
                session.price,
                undefined,
                undefined,
                2,
                2,
                settings
              )}
            </div>
          </div>
        </div>
      )}
      {session.description && (
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {t("description")}
            </div>
            <div className="text-sm">{session.description}</div>
          </div>
        </div>
      )}
    </div>
  </div>

  <div className="space-y-4">
    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
      {t("trainer")}
    </h3>
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <User className="w-4 h-4 text-muted-foreground shrink-0" />
        <div>
          <div className="text-xs text-muted-foreground">{t("name")}</div>
          <div className="font-medium">
            {trainerUser?.firstName} {trainerUser?.lastName}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
        <div>
          <div className="text-xs text-muted-foreground">
            {t("email")}
          </div>
          <div className="font-medium">{trainerUser?.email}</div>
        </div>
      </div>
      {trainer?.specialization && (
        <div className="flex items-center gap-3">
          <Target className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">
              {t("specialization")}
            </div>
            <div className="font-medium">{trainer.specialization}</div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>

{/* Members */ }
{
  membersUsers && membersUsers.length > 0 && (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Members ({membersUsers.length})
      </h3>
      <div className="space-y-3">
        {membersUsers.map((memberUser, index) => {
          const member = session.members?.find(
            (c) => c.user?.id === memberUser.id
          );
          return (
            <div
              key={memberUser.id || index}
              className="flex items-center justify-between gap-4 hover:bg-muted p-1 rounded-md border-b"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {memberUser.firstName} {memberUser.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {memberUser.email}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserAvailability
                    userId={memberUser.id}
                    dateTime={session.startDateTime}
                    duration={session.duration || 60}
                  />
                  {session.price && session.price > 0 && member?.id && (
                    <SessionPaymentStatus
                      sessionId={session.id}
                      memberId={member.id}
                      payNowButton={
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onPayNow(session, member.id)}
                          className="gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          {buildSentence(t, "pay", "now")}
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

{/* Recurrence */ }
{
  session.enableRecurrence && session.recurrenceConfig && (
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
              {session.recurrenceConfig.frequency || "-"}
            </div>
          </div>
        </div>
        {session.recurrenceConfig.frequency === EScheduleFrequency.WEEKLY &&
          session.recurrenceConfig.weekDays &&
          session.recurrenceConfig.weekDays.length > 0 && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {buildSentence(t, "week", "days")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {session.recurrenceConfig.weekDays.map(
                    (day: EDayOfWeek) => {
                      const dayNames = [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ];
                      return (
                        <Badge
                          key={day}
                          variant="outline"
                          className="text-xs"
                        >
                          {dayNames[day]}
                        </Badge>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}
        {session.recurrenceConfig.frequency ===
          EScheduleFrequency.MONTHLY &&
          session.recurrenceConfig.monthDays &&
          session.recurrenceConfig.monthDays.length > 0 && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {buildSentence(t, "month", "days")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {session.recurrenceConfig.monthDays.map((day, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      Day {day}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        {session.recurrenceEndDate && (
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">
                {buildSentence(t, "end", "date")}
              </div>
              <div className="font-medium">
                {formatDateTime(session.recurrenceEndDate, settings)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

{/* Reminders */ }
{
  session.enableReminders && session.reminderConfig && (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {t("reminders")}
      </h3>
      <div className="space-y-3">
        {session.reminderConfig.sendBefore &&
          session.reminderConfig.sendBefore.length > 0 && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {buildSentence(t, "send", "before")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {session.reminderConfig.sendBefore.map(
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
        {session.reminderConfig.reminderTypes &&
          session.reminderConfig.reminderTypes.length > 0 && (
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {buildSentence(t, "reminder", "types")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {session.reminderConfig.reminderTypes.map(
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
  )
}

{/* Notes */ }

<div className="space-y-3 pt-4 border-t">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
      {buildSentence(t, "notes")}
    </h3>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onEditNotes(session, EUpdateSessionScope.ALL)}
      className="gap-2"
    >
      <Pencil className="w-4 h-4" />
    </Button>
  </div>
  <NotesView notes={session.notes} t={t} />
</div>

{
  session.recurrenceConfig?.frequency !== EScheduleFrequency.ONCE &&
  session.recurrenceConfig?.frequency !== undefined && (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {buildSentence(
            t,
            "additional",
            "notes",
            "for",
            "this",
            "session"
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditNotes(session, EUpdateSessionScope.THIS)}
          className="gap-2"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
      <NotesView notes={session.additionalNotes} t={t} />
    </div>
  )
}

{/* Delete Scope Modal */ }
<SessionUpdateScopeModal
  open={showDeleteScopeModal}
  onOpenChange={setShowDeleteScopeModal}
  onSelect={handleDeleteScopeSelect}
/>
    </div >
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

  if (!notes) {
    return (
      <div className="space-y-2">
        <div className="border rounded-md p-3 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {buildSentence(t, "no", "notes")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="border rounded-md p-3 bg-muted/30">
        <div
          className={`text-sm text-foreground prose prose-sm max-w-none ${showFull ? "" : "max-h-[200px] overflow-y-auto"
            }`}
          dangerouslySetInnerHTML={{ __html: notes }}
        />
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
      </div>
    </div>
  );
}

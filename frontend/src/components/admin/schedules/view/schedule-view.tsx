import { Calendar, Clock, Activity, AlertCircle, CheckCircle, XCircle, Pencil, Trash2, Globe, Repeat } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useId, useMemo, useTransition } from "react";

// Types
import { type ISchedule } from "@shared/interfaces/schedule.interface";

// Components
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";

// Enums
import { EScheduleStatus } from "@shared/enums";

// Stores
import { type TSingleHandlerStore } from "@/stores";

// Config
import { type THandlerComponentProps } from "@/@types/handler-types";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { DialogContent } from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";

// Utils
import { 
  formatTimeOfDay, 
  formatInterval,
  getDayOfWeekName,
  getMonthName 
} from "@/utils/date-format";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export interface IScheduleViewExtraProps { }

interface IScheduleViewProps extends THandlerComponentProps<TSingleHandlerStore<ISchedule, IScheduleViewExtraProps>> { }

const getStatusColor = (status: EScheduleStatus) => {
  switch (status) {
    case EScheduleStatus.ACTIVE:
      return "bg-green-100 text-green-800 border-green-200";
    case EScheduleStatus.PAUSED:
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case EScheduleStatus.COMPLETED:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case EScheduleStatus.FAILED:
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

interface IScheduleDetailContentProps {
  schedule: ISchedule;
  onEdit?: (schedule: ISchedule) => void;
  onDelete?: (schedule: ISchedule) => void;
}


function ScheduleView({ store, storeKey }: IScheduleViewProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { response: item, action, reset, setAction } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        reset: state.reset,
        setAction: state.setAction,
    })));

    if (!item) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEdit = (schedule: ISchedule) => {
        startTransition(() => {
            setAction("createOrUpdate", schedule.id);
        });
    };

    const onDelete = (schedule: ISchedule) => {
        startTransition(() => {
            setAction("delete", schedule.id);
        });
    };

  return (
    <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
    <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
            title={buildSentence(t, "schedule", "details")}
            description={buildSentence(t, "view", "detailed", "information", "about", "this", "schedule")}
        >
          <ScheduleDetailContent
            schedule={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
    </AppDialog>
    </DialogContent>
    </Dialog>
  );
}

function ScheduleDetailContent({
  schedule,
  onEdit,
  onDelete,
}: IScheduleDetailContentProps) {
  const componentId = useId();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  // Get timezone for display
  const timezone = useMemo(
    () =>
      schedule.timezone ||
      settings?.time?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    [schedule.timezone, settings?.time?.timezone]
  );

  // Format timezone label
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

      const cityName =
        timezone.split("/").pop()?.replace(/_/g, " ") || timezone;
      return tzName ? `${tzName} (${cityName})` : cityName;
    } catch {
      return timezone;
    }
  }, [timezone]);

  const successRate = useMemo(() => {
    return schedule.executionCount > 0 
      ? ((schedule.successCount / schedule.executionCount) * 100).toFixed(1) 
      : 0;
  }, [schedule.executionCount, schedule.successCount]);

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">
                {schedule.title}
              </h2>
              <Badge
                variant="outline"
                className={getStatusColor(schedule.status)}
              >
                {schedule.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(schedule)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  {buildSentence(t, "edit")}
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(schedule)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {buildSentence(t, "delete")}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="capitalize">{schedule.frequency} {t("schedule")}</span>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Repeat className="w-4 h-4" />
            <span className="font-mono text-xs">{schedule.action}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(schedule.nextRunDate, settings)}</span>
          </div>
          {schedule.timezone && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>{timezoneLabel}</span>
              </div>
            </>
          )}
        </div>
      </AppCard>

      {/* Schedule Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "schedule", "information")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Repeat className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("frequency")}
                </div>
                <div className="font-medium capitalize">{schedule.frequency}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "start", "date")}
                </div>
                <div className="font-medium">{formatDate(schedule.startDate, settings)}</div>
              </div>
            </div>
            {schedule.endDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "end", "date")}
                  </div>
                  <div className="font-medium">{formatDate(schedule.endDate, settings)}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "next", "run")}
                </div>
                <div className="font-medium">{formatDate(schedule.nextRunDate, settings)}</div>
              </div>
            </div>
            {schedule.lastRunAt && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "last", "run")}
                  </div>
                  <div className="font-medium">{formatDateTime(schedule.lastRunAt, settings)}</div>
                </div>
              </div>
            )}
            {schedule.description && (
              <div className="flex items-start gap-3">
                <Activity className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("description")}
                  </div>
                  <div className="text-sm">{schedule.description}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "time", "configuration")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "start", "time")}
                </div>
                <div className="font-medium">{formatTimeOfDay(schedule.timeOfDay)}</div>
              </div>
            </div>
            {schedule.interval && (
              <>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("interval")}
                    </div>
                    <div className="font-medium">
                      {formatInterval(schedule.intervalValue || schedule.interval, schedule.intervalUnit)}
                      {!schedule.intervalValue && ` (${schedule.interval} min)`}
                    </div>
                  </div>
                </div>
                {schedule.endTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {buildSentence(t, "end", "time")}
                      </div>
                      <div className="font-medium">{formatTimeOfDay(schedule.endTime)}</div>
                    </div>
                  </div>
                )}
              </>
            )}
            {schedule.weekDays && schedule.weekDays.length > 0 && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "week", "days")}
                  </div>
                  <div className="font-medium">
                    {schedule.weekDays.map(d => getDayOfWeekName(d)).join(', ')}
                  </div>
                </div>
              </div>
            )}
            {schedule.monthDays && schedule.monthDays.length > 0 && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "days", "of", "month")}
                  </div>
                  <div className="font-medium">{schedule.monthDays.join(', ')}</div>
                </div>
              </div>
            )}
            {schedule.months && schedule.months.length > 0 && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("months")}
                  </div>
                  <div className="font-medium">
                    {schedule.months.map(m => getMonthName(m)).join(', ')}
                  </div>
                </div>
              </div>
            )}
            {schedule.timezone && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("timezone")}
                  </div>
                  <div className="font-medium font-mono text-sm">{timezoneLabel}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execution Statistics */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {buildSentence(t, "execution", "statistics")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{schedule.executionCount}</div>
            <div className="text-sm text-muted-foreground">{buildSentence(t, "total", "runs")}</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{schedule.successCount}</div>
            <div className="text-sm text-muted-foreground">{t("successful")}</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{schedule.failureCount}</div>
            <div className="text-sm text-muted-foreground">{t("failed")}</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
            <div className="text-sm text-muted-foreground">{buildSentence(t, "success", "rate")}</div>
          </div>
        </div>

        {schedule.lastExecutionStatus && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {schedule.lastExecutionStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="font-medium">
                {buildSentence(t, "last", "execution")}: {schedule.lastExecutionStatus}
              </span>
            </div>
            {schedule.lastErrorMessage && (
              <div className="mt-2 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{schedule.lastErrorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Execution History */}
      {schedule.executionHistory && schedule.executionHistory.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "execution", "history")} ({schedule.executionHistory.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {schedule.executionHistory.map((execution: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  execution.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {execution.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium capitalize">{execution.status}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(execution.executedAt, settings)}
                  </span>
                </div>
                {execution.errorMessage && (
                  <div className="mt-2 text-sm text-red-600">
                    {execution.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Data */}
      {schedule.data && Object.keys(schedule.data).length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "additional", "data")}
          </h3>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(schedule.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ScheduleView;


// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useMemo, useTransition, useState } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { SnapshotsGrid } from "../list/checkin-snapshot-view";
import {
  Calendar,
  Clock,
  MapPin,
  Smartphone,
  User,
  Mail,
  Pencil,
  Trash2,
} from "lucide-react";

// Types
import { type ICheckin } from "@shared/interfaces/checkin.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDate, formatDateTime, formatDateTimeWithTimezone } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";

export type TCheckinViewExtraProps = {};

type ICheckinViewProps = THandlerComponentProps<
  TSingleHandlerStore<ICheckin, TCheckinViewExtraProps>
>;

export default function CheckinView({ storeKey, store }: ICheckinViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<ICheckin, TCheckinViewExtraProps>) => ({
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

  const { response: checkin, action, setAction, reset } = storeState;

  if (!checkin) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = (checkin: ICheckin) => {
    startTransition(() => {
      setAction("createOrUpdate", checkin.id);
    });
  };

  const onDelete = (checkin: ICheckin) => {
    startTransition(() => {
      setAction("delete", checkin.id);
    });
  };

  const onCheckout = (checkin: ICheckin) => {
    startTransition(() => {
      setAction("checkout", checkin.id);
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
          title={buildSentence(t, "check-in", "details")}
          description={buildSentence(t, "view detailed information about the check-in")}
        >
          <CheckinDetailContent
            checkin={checkin}
            onEdit={onEdit}
            onDelete={onDelete}
            onCheckout={onCheckout}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface ICheckinDetailContentProps {
  checkin: ICheckin;
  onEdit: (checkin: ICheckin) => void;
  onDelete: (checkin: ICheckin) => void;
  onCheckout: (checkin: ICheckin) => void;
}

function CheckinDetailContent({
  checkin,
  onEdit,
  onDelete,
  onCheckout,
}: ICheckinDetailContentProps) {
  // React 19: Essential IDs
  const componentId = useId();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  // React 19: Memoized date formatting for better performance - use checkin timezone
  const checkInTime = useMemo(
    () =>
      checkin.checkInTime
        ? formatDateTimeWithTimezone(checkin.checkInTime, checkin.timezone, settings)
        : "",
    [checkin.checkInTime, checkin.timezone, settings]
  );

  const checkOutTime = useMemo(
    () =>
      checkin.checkOutTime
        ? formatDateTimeWithTimezone(checkin.checkOutTime, checkin.timezone, settings)
        : "",
    [checkin.checkOutTime, checkin.timezone, settings]
  );

  const createdAt = useMemo(
    () => (checkin.createdAt ? formatDate(checkin.createdAt, settings) : ""),
    [checkin.createdAt, settings]
  );

  const updatedAt = useMemo(
    () => (checkin.updatedAt ? formatDate(checkin.updatedAt, settings) : ""),
    [checkin.updatedAt, settings]
  );

  const user = checkin.user as any;
  const userName = user?.firstName || user?.lastName
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : user?.email || "-";
  const userEmail = user?.email || "-";

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">{userName}</h2>
              {!checkin.checkOutTime && (
                <Badge variant="default">
                  {buildSentence(t, "checked", "in")}
                </Badge>
              )}
              {checkin.checkOutTime && (
                <Badge variant="secondary">
                  {buildSentence(t, "checked", "out")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!checkin.checkOutTime && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onCheckout(checkin)}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {buildSentence(t, "checkout")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(checkin)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {buildSentence(t, "edit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(checkin)}
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
          <span>{buildSentence(t, "checkin")}</span>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{checkInTime}</span>
          </div>
          {checkin.checkOutTime && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{checkOutTime}</span>
              </div>
            </>
          )}
          {checkin.location && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>
                  {typeof checkin.location === 'string' 
                    ? checkin.location 
                    : checkin.location.name || checkin.location.address || t("location")}
                </span>
              </div>
            </>
          )}
          {checkin.door && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>
                  {typeof checkin.door === 'string' 
                    ? checkin.door 
                    : checkin.door.name || t("door")}
                </span>
              </div>
            </>
          )}
        </div>
      </AppCard>

      {/* Check-In Information and User Information - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "checkin", "information")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "checkin", "time")}
                </div>
                <div className="font-medium">{checkInTime}</div>
              </div>
            </div>
            {checkin.checkOutTime && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "checkout", "time")}
                  </div>
                  <div className="font-medium">{checkOutTime}</div>
                </div>
              </div>
            )}
            {!checkin.checkOutTime && (
              <div className="flex items-center gap-3">
                <Badge variant="default">
                  {buildSentence(t, "currently", "checked", "in")}
                </Badge>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{checkin.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("location")}
                  </div>
                  <div className="font-medium">
                    {typeof checkin.location === 'string' 
                      ? checkin.location 
                      : checkin.location.name || checkin.location.address || t("location")}
                  </div>
                  {typeof checkin.location === 'object' && checkin.location.address && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {checkin.location.address}
                    </div>
                  )}
                </div>
              </div>
            )}
            {checkin.door && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("door")}
                  </div>
                  <div className="font-medium">
                    {typeof checkin.door === 'string' 
                      ? checkin.door 
                      : checkin.door.name || t("door")}
                  </div>
                  {typeof checkin.door === 'object' && checkin.door.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {checkin.door.description}
                    </div>
                  )}
                </div>
              </div>
            )}</div>
            
            {checkin.deviceId && (
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "device", "id")}
                  </div>
                  <div className="font-medium">{checkin.deviceId}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("user")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("name")}</div>
                <div className="font-medium">{userName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("email")}
                </div>
                <div className="font-medium">{userEmail}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3 pt-4 border-t">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {buildSentence(t, "notes")}
        </h3>
        <NotesView notes={checkin.notes} t={t} />
      </div>

      {/* Snapshots */}
      <div className="space-y-3 pt-4 border-t">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {buildSentence(t, "snapshots")}
        </h3>
        <SnapshotsGrid snapshots={checkin.snapshots} t={t} />
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


// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useMemo, useTransition } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import {
  Package,
  Calendar,
  Clock,
  FileText,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Types
import { type IEquipmentReservation } from "@shared/interfaces/equipment-reservation.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

type IEquipmentReservationViewProps = THandlerComponentProps<
  TSingleHandlerStore<IEquipmentReservation, any>
>;

export default function EquipmentReservationView({ storeKey, store }: IEquipmentReservationViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow((state: ISingleHandlerState<IEquipmentReservation, any>) => ({
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

  const { response: reservation, action, setAction, reset } = storeState;

  if (!reservation) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = (reservation: IEquipmentReservation) => {
    startTransition(() => {
      setAction("createOrUpdate", reservation.id);
    });
  };

  const onDelete = (reservation: IEquipmentReservation) => {
    startTransition(() => {
      setAction("delete", reservation.id);
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
          title={buildSentence(t, "equipment", "reservation", "details")}
          description={buildSentence(
            t,
            "view",
            "detailed",
            "information",
            "about",
            "this",
            "equipment",
            "reservation"
          )}
        >
          <EquipmentReservationDetailContent
            reservation={reservation}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface IEquipmentReservationDetailContentProps {
  reservation: IEquipmentReservation;
  onEdit: (reservation: IEquipmentReservation) => void;
  onDelete: (reservation: IEquipmentReservation) => void;
}

function EquipmentReservationDetailContent({
  reservation,
  onEdit,
  onDelete,
}: IEquipmentReservationDetailContentProps) {
  // React 19: Essential IDs
  const componentId = useId();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  // React 19: Memoized date formatting for better performance
  const startDate = useMemo(
    () => (reservation.startDateTime ? formatDate(reservation.startDateTime, settings) : ""),
    [reservation.startDateTime, settings]
  );

  const startTime = useMemo(
    () => (reservation.startDateTime ? formatTime(reservation.startDateTime, settings) : ""),
    [reservation.startDateTime, settings]
  );

  const endDate = useMemo(
    () => (reservation.endDateTime ? formatDate(reservation.endDateTime, settings) : ""),
    [reservation.endDateTime, settings]
  );

  const endTime = useMemo(
    () => (reservation.endDateTime ? formatTime(reservation.endDateTime, settings) : ""),
    [reservation.endDateTime, settings]
  );

  const createdAt = useMemo(
    () => (reservation.createdAt ? formatDate(reservation.createdAt, settings) : ""),
    [reservation.createdAt, settings]
  );

  const updatedAt = useMemo(
    () => (reservation.updatedAt ? formatDate(reservation.updatedAt, settings) : ""),
    [reservation.updatedAt, settings]
  );


  return (
    <div className="space-y-4" data-component-id={componentId}>
      {/* Header Card */}
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">
                {reservation.equipment?.name || buildSentence(t, "equipment", "reservation")}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(reservation)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {buildSentence(t, "edit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(reservation)}
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
          {reservation.equipment?.equipmentType && (
            <>
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                <span className="font-semibold text-foreground">
                  {reservation.equipment.equipmentType.name}
                </span>
              </div>
              <span>•</span>
            </>
          )}
          {startDate && startTime && (
            <>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{startDate} at {startTime}</span>
              </div>
            </>
          )}
        </div>
      </AppCard>

      {/* Reservation Details - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "reservation", "information")}
          </h3>
          <div className="space-y-3">
            {reservation.equipment && (
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "equipment")}
                  </div>
                  <div className="font-medium">{reservation.equipment.name}</div>
                  {reservation.equipment.equipmentType && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {reservation.equipment.equipmentType.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            {startDate && startTime && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "start", "date", "time")}
                  </div>
                  <div className="font-medium">
                    {startDate} at {startTime}
                  </div>
                </div>
              </div>
            )}

            {endDate && endTime && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "end", "date", "time")}
                  </div>
                  <div className="font-medium">
                    {endDate} at {endTime}
                  </div>
                </div>
              </div>
            )}

            {reservation.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {buildSentence(t, "notes")}
                  </div>
                  <div className="text-sm">{reservation.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "metadata")}
          </h3>
          <div className="space-y-3">
            {createdAt && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "created", "at")}
                  </div>
                  <div className="font-medium">{createdAt}</div>
                </div>
              </div>
            )}
            {updatedAt && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "updated", "at")}
                  </div>
                  <div className="font-medium">{updatedAt}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

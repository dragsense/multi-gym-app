// External Libraries
import { useId, useTransition, useCallback, useMemo, useState, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TSingleHandlerStore } from "@/stores";
import { type ICheckin } from "@shared/interfaces/checkin.interface";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, User, Calendar } from "lucide-react";
import { DateTimePicker } from "@/components/form-ui/date-picker";

// Services
import { checkoutCheckin } from "@/services/checkin.api";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDateTimeWithTimezone } from "@/lib/utils";
import { toast } from "sonner";

export type TCheckinCheckoutExtraProps = Record<string, unknown>;

type ICheckinCheckoutProps = THandlerComponentProps<
  TSingleHandlerStore<ICheckin, TCheckinCheckoutExtraProps>
>;

export default function CheckinCheckout({
  storeKey,
  store,
}: ICheckinCheckoutProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { settings } = useUserSettings();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow((state: any) => ({
    action: state.action,
    payload: state.payload,
    response: state.response,
    setAction: state.setAction,
  }));

  const storeState = store ? store(selector) : null;

  const checkinId = storeState?.payload as string | null;
  const checkin = storeState?.response as ICheckin | undefined;
  const open = storeState?.action === "checkout" && !!checkinId && !!checkin;

  const handleClose = useCallback(() => {
    if (!storeState?.setAction) return;
    startTransition(() => {
      storeState.setAction("none");
      setCustomCheckoutTime(""); // Reset checkout time when closing
    });
  }, [storeState?.setAction, startTransition]);

  // State for custom checkout time
  const [customCheckoutTime, setCustomCheckoutTime] = useState<string>("");

  // Initialize checkout time to current time when modal opens
  useEffect(() => {
    if (open && checkin) {
      const now = new Date().toISOString();
      setCustomCheckoutTime(now);
    }
  }, [open, checkin]);

  const { mutate: checkout, isPending } = useMutation({
    mutationFn: (checkoutTime?: string) => checkoutCheckin(checkinId!, checkoutTime),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
      queryClient.invalidateQueries({ queryKey: [storeKey] });
      toast.success(
        response?.message || buildSentence(t, "checkin", "checked", "out", "successfully")
      );
      handleClose();
    },
    onError: (error: Error) => {
      const errorMessage =
        error?.message || buildSentence(t, "failed", "to", "checkout", "checkin");
      toast.error(errorMessage);
    },
  });

  const handleConfirm = () => {
    // Validate checkout time is after check-in time
    if (customCheckoutTime && checkin?.checkInTime) {
      const checkoutDate = new Date(customCheckoutTime);
      const checkInDate = new Date(checkin.checkInTime);
      
      if (checkoutDate <= checkInDate) {
        toast.error(buildSentence(t, "checkout", "time", "must", "be", "after", "checkin", "time"));
        return;
      }
    }

    checkout(customCheckoutTime || undefined);
  };

  // Memoize formatted times - must be called before early returns
  const checkInTime = useMemo(
    () =>
      checkin?.checkInTime
        ? formatDateTimeWithTimezone(checkin.checkInTime, checkin.timezone, settings)
        : "",
    [checkin?.checkInTime, checkin?.timezone, settings]
  );

  // Format custom checkout time for display
  const formattedCheckoutTime = useMemo(() => {
    if (!customCheckoutTime || !checkin?.timezone) return "";
    return formatDateTimeWithTimezone(customCheckoutTime, checkin.timezone, settings);
  }, [customCheckoutTime, checkin?.timezone, settings]);

  if (!store) {
    return null;
  }

  if (!storeState) {
    return null;
  }

  if (!checkinId || !checkin) {
    return null;
  }

  // Don't show checkout if already checked out
  if (checkin.checkOutTime) {
    return null;
  }

  const user = checkin.user as any;
  const userName = user?.firstName || user?.lastName
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : user?.email || "-";

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      data-component-id={componentId}
    >
      <DialogContent className="sm:max-w-md">
        <AppDialog
          title={buildSentence(t, "checkout")}
          description={buildSentence(
            t,
            "confirm",
            "checkout",
            "for",
            "this",
            "checkin"
          )}
          footerContent={
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending
                  ? buildSentence(t, "processing")
                  : buildSentence(t, "confirm", "checkout")}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <AppCard>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {buildSentence(t, "user")}
                    </div>
                    <div className="font-medium">{userName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {buildSentence(t, "checkin", "time")}
                    </div>
                    <div className="font-medium">{checkInTime}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkout-time">
                    {buildSentence(t, "checkout", "time")}
                  </Label>
                  <DateTimePicker
                    value={customCheckoutTime ? new Date(customCheckoutTime) : undefined}
                    onChange={(value) => setCustomCheckoutTime(value)}
                    placeholder={buildSentence(t, "select", "checkout", "time")}
                    className="w-full"
                  />
                  {formattedCheckoutTime && (
                    <div className="text-xs text-muted-foreground">
                      {buildSentence(t, "formatted")}: {formattedCheckoutTime}
                    </div>
                  )}
                </div>

                {checkin.timezone && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {buildSentence(t, "timezone")}
                      </div>
                      <div className="font-medium">{checkin.timezone}</div>
                    </div>
                  </div>
                )}

                {checkin.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {buildSentence(t, "location")}
                      </div>
                      <div className="font-medium">
                        {typeof checkin.location === 'string' 
                          ? checkin.location 
                          : checkin.location.name || checkin.location.address || buildSentence(t, "location")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AppCard>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}


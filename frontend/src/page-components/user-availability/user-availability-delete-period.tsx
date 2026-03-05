// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useTransition, useState } from "react";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IUserAvailability } from "@shared/interfaces/user-availability.interface";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";
import type { TUserAvailabilityData } from "@shared/types";
import type { TUserAvailabilityExtraProps } from "./user-availability-form";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDateString } from "@/lib/utils";

// Services
import { createUserAvailability } from "@/services/user-availability.api";

type IUserAvailabilityDeletePeriodProps = THandlerComponentProps<
  TSingleHandlerStore<IUserAvailability, TUserAvailabilityExtraProps>
>;

export default function UserAvailabilityDeletePeriod({
  storeKey,
  store,
}: IUserAvailabilityDeletePeriodProps) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const { settings } = useUserSettings();

  const selector = useShallow(
    (
      state: ISingleHandlerState<
        IUserAvailability,
        TUserAvailabilityExtraProps
      >,
    ) => ({
      action: state.action,
      response: state.response,
      extra: state.extra,
      setAction: state.setAction,
      setExtra: state.setExtra,
    }),
  );

  const storeState = store ? store(selector) : null;
  const availability = storeState?.response;
  const periodIndex =
    typeof storeState?.extra?.deletePeriodIndex === "number"
      ? storeState.extra.deletePeriodIndex
      : null;
  const period = periodIndex != null && availability?.unavailablePeriods?.[periodIndex]
    ? availability.unavailablePeriods[periodIndex]
    : null;

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      setError(null);
      storeState.setExtra("deletePeriodIndex", undefined);
      storeState.setAction("none");
    });
  }, [storeState, startTransition]);

  const deletePeriodMutation = useApiMutation(
    async (indexToRemove: number) => {
      if (!availability?.weeklySchedule || !availability?.unavailablePeriods) {
        throw new Error("No availability data");
      }
      const updatedPeriods = availability.unavailablePeriods.filter(
        (_, i) => i !== indexToRemove,
      );
      const payload: TUserAvailabilityData = {
        weeklySchedule: availability.weeklySchedule,
        unavailablePeriods: updatedPeriods,
      };
      return createUserAvailability(payload);
    },
    {
      onSuccess: () => {
        startTransition(() => {
          queryClient.invalidateQueries({ queryKey: [storeKey + "-single"] });
          handleClose();
        });
      },
      onError: (err: Error) => {
        startTransition(() => {
          setError(
            err?.message ?? buildSentence(t, "failed", "to", "delete"),
          );
        });
      },
    },
  );

  const handleConfirm = useCallback(() => {
    if (periodIndex === null) return;
    deletePeriodMutation.mutate(periodIndex);
  }, [periodIndex, deletePeriodMutation]);

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!availability || periodIndex === null || !period) {
    return null;
  }

  const { action } = storeState!;
  const isOpen = action === "deleteUnavailablePeriod";

  if (!isOpen) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>
                {buildSentence(t, "delete", "unavailablePeriods")}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                {buildSentence(
                  t,
                  "are",
                  "you",
                  "sure",
                  "you",
                  "want",
                  "to",
                  "delete",
                  "this",
                )}
                ?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-sm">
              <div className="font-medium text-red-900 mb-2">
                {period.reason ?? buildSentence(t, "unavailablePeriods")}
              </div>
              <div className="text-red-700">
                {formatDateString(period.dateRange?.[0], settings)} –{" "}
                {formatDateString(period.dateRange?.[1], settings)}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 mt-2">{error}</div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleClose}
            disabled={deletePeriodMutation.isPending}
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deletePeriodMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deletePeriodMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {buildSentence(t, "delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

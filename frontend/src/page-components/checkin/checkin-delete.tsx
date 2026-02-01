// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useTransition, useState } from "react";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ICheckin } from "@shared/interfaces/checkin.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

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
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { formatDateTimeWithTimezone } from "@/lib/utils";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { deleteCheckin } from "@/services/checkin.api";

export type TCheckinDeleteExtraProps = Record<string, unknown>;

type ICheckinDeleteProps = THandlerComponentProps<
  TSingleHandlerStore<ICheckin, TCheckinDeleteExtraProps>
>;

export default function CheckinDelete({
  storeKey,
  store,
}: ICheckinDeleteProps) {
  // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { settings } = useUserSettings();
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<ICheckin, TCheckinDeleteExtraProps>) => ({
      action: state.action,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;
  const checkin = storeState?.response;

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      setError(null);
      storeState.reset();
      storeState.setAction("none");
    });
  }, [storeState, startTransition]);

  const deleteMutation = useApiMutation(
    async (id: string) => {
      const result = await deleteCheckin(id);
      return result;
    },
    {
      onSuccess: () => {
        startTransition(() => {
          queryClient.invalidateQueries({
            queryKey: [storeKey],
          });
          queryClient.invalidateQueries({
            queryKey: [storeKey + "-list"],
          });
          handleClose();
        });
      },
      onError: (error: Error) => {
        startTransition(() => {
          setError(error?.message || "Failed to delete checkin");
        });
      },
    }
  );

  const handleConfirm = useCallback(() => {
    if (!checkin?.id) return;
    deleteMutation.mutate(checkin.id);
  }, [checkin, deleteMutation]);

  // Format check-in time
  const checkInTime = checkin?.checkInTime
    ? formatDateTimeWithTimezone(
        checkin.checkInTime,
        checkin.timezone,
        settings
      )
    : "";

  // Format check-out time if exists
  const checkOutTime = checkin?.checkOutTime
    ? formatDateTimeWithTimezone(
        checkin.checkOutTime,
        checkin.timezone,
        settings
      )
    : "";

  // Get user name
  const user = checkin?.user as any;
  const userName = user?.firstName || user?.lastName
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : user?.email || "-";

  // Early returns AFTER all hooks
  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!checkin) {
    return null;
  }

  const { action } = storeState!;
  const isOpen = action === "delete";

  if (!isOpen) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>
                {buildSentence(t, "delete", "checkin")}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                {buildSentence(
                  t,
                  "are",
                  "you",
                  "you want to delete this checkin"
                )}
                ? {buildSentence(t, "this", "action", "cannot", "be", "undone")}.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-sm">
              <div className="font-medium text-red-900 mb-2">
                {buildSentence(t, "user")}: {userName}
              </div>
              <div className="text-red-700 space-y-1">
                {checkInTime && (
                  <div>
                    {buildSentence(t, "checkin", "time")}: {checkInTime}
                  </div>
                )}
                {checkOutTime && (
                  <div>
                    {buildSentence(t, "checkout", "time")}: {checkOutTime}
                  </div>
                )}
                {checkin.location && (
                  <div>
                    {buildSentence(t, "location")}: {checkin.location}
                  </div>
                )}
                {checkin.timezone && (
                  <div>
                    {buildSentence(t, "timezone")}: {checkin.timezone}
                  </div>
                )}
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
            disabled={deleteMutation.isPending}
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {buildSentence(t, "delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


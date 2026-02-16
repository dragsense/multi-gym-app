// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useTransition, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISession } from "@shared/interfaces/session.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Services
import { cancelSession } from "@/services/session.api";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { formatDate, formatTime } from "@/lib/utils";
import { useApiMutation } from "@/hooks/use-api-mutation";

export type TSessionCancelExtraProps = Record<string, unknown>;

type ISessionCancelProps = THandlerComponentProps<
  TSingleHandlerStore<ISession, TSessionCancelExtraProps>
>;

export default function SessionCancel({
  storeKey,
  store,
}: ISessionCancelProps) {
  // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { settings } = useUserSettings();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<ISession, TSessionCancelExtraProps>) => ({
      action: state.action,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;
  const session = storeState?.response;

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      setError(null);
      setReason("");
      storeState.reset();
      storeState.setAction("none");
    });
  }, [storeState, startTransition]);

  const cancelMutation = useApiMutation(
    async ({ id, reason }: { id: string; reason?: string }) => {
      const result = await cancelSession(id, reason);
      return result;
    },
    {
      onSuccess: () => {
        startTransition(() => {
          queryClient.invalidateQueries({
            queryKey: [storeKey + "-calendar"],
          });
          handleClose();
        });
      },
      onError: (error: Error) => {
        startTransition(() => {
          setError(error?.message || "Failed to cancel session");
        });
      },
    }
  );

  const handleConfirm = useCallback(() => {
    if (!session?.id) return;
    cancelMutation.mutate({
      id: session.id,
      reason: reason.trim() || undefined,
    });
  }, [session, cancelMutation, reason]);

  const sessionStartDate = useMemo(
    () =>
      session?.startDateTime ? formatDate(session.startDateTime, settings) : "",
    [session?.startDateTime, settings]
  );

  const sessionStartTime = useMemo(
    () =>
      session?.startDateTime ? formatTime(session.startDateTime, settings) : "",
    [session?.startDateTime, settings]
  );

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

  if (!session) {
    return null;
  }

  const { action } = storeState!;

  return (
    <>
      <Dialog open={action === "cancel"} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {buildSentence(t, "confirm", "session", "cancellation")}
            </DialogTitle>
            <DialogDescription>
              {buildSentence(
                t,
                "are",
                "you",
                "sure",
                "you",
                "want",
                "to",
                "cancel",
                "this",
                "session"
              )}
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="text-sm">
              <div className="font-medium mb-2">{session.title}</div>
              <div className="text-muted-foreground">
                <div>
                  {sessionStartDate} at {sessionStartTime}
                </div>
                {session.duration && (
                  <div>
                    {session.duration} {t("minutes")}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">
                {buildSentence(t, "reason", "for", "cancellation")} (
                {t("optional")})
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder={buildSentence(
                  t,
                  "enter",
                  "reason",
                  "for",
                  "cancelling",
                  "this",
                  "session"
                )}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500 mt-2">{error}</div>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={cancelMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {buildSentence(t, "confirm", "cancellation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

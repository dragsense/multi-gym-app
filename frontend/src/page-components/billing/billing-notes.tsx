// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useTransition, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IBilling } from "@shared/interfaces/billing.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Services
import { updateBillingNotes } from "@/services/billing.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { AppDialog } from "@/components/layout-ui/app-dialog";

export type TBillingNotesExtraProps = Record<string, unknown>;

type IBillingNotesProps = THandlerComponentProps<
  TSingleHandlerStore<IBilling, TBillingNotesExtraProps>
>;

export default function BillingNotes({ storeKey, store }: IBillingNotesProps) {
  // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<IBilling, TBillingNotesExtraProps>) => ({
      action: state.action,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;
  const billing = storeState?.response;

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      setError(null);
      setNotes("");
      storeState.reset();
      storeState.setAction("none");
    });
  }, [storeState, startTransition]);

  const updateNotesMutation = useApiMutation(
    async ({ id, notes }: { id: string; notes?: string }) => {
      const result = await updateBillingNotes(id, {
        notes,
      });
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
          setError(error?.message || "Failed to update notes");
        });
      },
    }
  );

  const handleConfirm = useCallback(() => {
    if (!billing?.id) return;

    const payload: {
      id: string;
      notes?: string;
    } = {
      id: billing.id,
      notes: notes,
    };

    updateNotesMutation.mutate(payload);
  }, [billing, notes, updateNotesMutation]);

  // Initialize form values when billing changes
  useMemo(() => {
    if (billing) {
      setNotes(billing.notes || "");
    }
  }, [billing]);

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

  if (!billing) {
    return null;
  }

  const { action } = storeState!;
  const isOpen = action === "notes";

  if (!isOpen) {
    return null;
  }

  const title = buildSentence(t, "billing", "notes");

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <AppDialog
            title={<DialogTitle>{title}</DialogTitle>}
            footerContent={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={updateNotesMutation.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleConfirm}
                  disabled={updateNotesMutation.isPending}
                >
                  {updateNotesMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  {buildSentence(t, "save")}
                </Button>
              </>
            }
          >
            <div className="space-y-3 py-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <Label htmlFor="notes">{buildSentence(t, "notes")}</Label>
                <Textarea
                  id="notes"
                  placeholder={buildSentence(t, "enter", "notes")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          </AppDialog>
        </DialogContent>
      </Dialog>
    </>
  );
}

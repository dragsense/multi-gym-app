// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useTransition, useState } from "react";
import { Label } from "@/components/ui/label";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISession } from "@shared/interfaces/session.interface";
import { EUpdateSessionScope } from "@shared/enums/session.enum";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuillEditor } from "@/components/shared-ui/quill-editor";

// Services
import { updateSessionNotes } from "@/services/session.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { AppDialog } from "@/components/layout-ui/app-dialog";

export type TSessionNotesExtraProps = {
  updateScope: EUpdateSessionScope;
};

type ISessionNotesProps = THandlerComponentProps<
  TSingleHandlerStore<ISession, TSessionNotesExtraProps>
>;

export default function SessionNotes({ storeKey, store }: ISessionNotesProps) {
  // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<ISession, TSessionNotesExtraProps>) => ({
      action: state.action,
      response: state.response,
      extra: state.extra,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;
  const session = storeState?.response;
  const updateScope = storeState?.extra?.updateScope || EUpdateSessionScope.ALL;

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
    async ({
      id,
      notes,
      additionalNotes,
      updateScope,
    }: {
      id: string;
      notes?: string;
      additionalNotes?: string;
      updateScope?: EUpdateSessionScope;
    }) => {
      const result = await updateSessionNotes(id, {
        notes,
        additionalNotes,
        updateScope: updateScope,
      });
      return result;
    },
    {
      onSuccess: () => {
        startTransition(() => {
          queryClient.invalidateQueries({
            queryKey: [storeKey],
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
    if (!session?.id) return;

    const payload: {
      id: string;
      notes?: string;
      updateScope?: EUpdateSessionScope;
    } = {
      id: session.id,
      notes: notes,
      updateScope: updateScope,
    };

    updateNotesMutation.mutate(payload);
  }, [session, updateScope, notes, updateNotesMutation]);

  // Initialize form values when session changes
  useMemo(() => {
    if (session) {
      if (updateScope === EUpdateSessionScope.ALL) {
        setNotes(session.notes || "");
      } else {
        setNotes(session.additionalNotes || "");
      }
    }
  }, [session, updateScope]);

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
  const isOpen = action === "notes";

  if (!isOpen) {
    return null;
  }

  const title = buildSentence(t, "session", "notes");

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
              <div className="space-y-2">
                <Label>
                  {buildSentence(t, "notes")}
                  {updateScope === EUpdateSessionScope.THIS && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({buildSentence(t, "applies", "to", "this", "session")})
                    </span>
                  )}
                </Label>
                <QuillEditor
                  value={notes}
                  onChange={setNotes}
                  placeholder={buildSentence(t, "enter", "notes")}
                  minHeight="300px"
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

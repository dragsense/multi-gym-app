// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useTransition, useState } from "react";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IEmailTemplate } from "@shared/interfaces/cms.interface";
import type { TUpdateEmailTemplateData } from "@shared/types/cms.type";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";

// Services
import { updateEmailTemplate } from "@/services/cms.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";

export type TEmailTemplateActivateExtraProps = Record<string, unknown>;

type IEmailTemplateActivateProps = THandlerComponentProps<
  TSingleHandlerStore<IEmailTemplate, TEmailTemplateActivateExtraProps>
>;

export default function EmailTemplateActivate({
  storeKey,
  store,
}: IEmailTemplateActivateProps) {
  // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<IEmailTemplate, TEmailTemplateActivateExtraProps>) => ({
      action: state.action,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;
  const template = storeState?.response;

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      setError("");
      storeState.reset();
      storeState.setAction("none");
    });
  }, [storeState, startTransition]);

  const activateMutation = useApiMutation(
    async (data: TUpdateEmailTemplateData) => {
      if (!template?.id) throw new Error("Email template ID is required");
      return updateEmailTemplate(template.id)(data);
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
          setError(
            error?.message ||
              buildSentence(t, "failed", "to", "update", "emailTemplate", "status")
          );
        });
      },
    }
  );

  const handleConfirm = useCallback(() => {
    if (!template?.id) return;
    activateMutation.mutate({
      isActive: !template.isActive,
    } as TUpdateEmailTemplateData);
  }, [template, activateMutation]);

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

  if (!template) {
    return null;
  }

  const { action } = storeState!;
  const isActivating = !template.isActive;

  return (
    <Dialog
      open={action === "activate" || action === "deactivate"}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="max-w-md">
        <AppDialog
          title={
            isActivating
              ? buildSentence(t, "activate", "emailTemplate")
              : buildSentence(t, "deactivate", "emailTemplate")
          }
          description={
            isActivating
              ? buildSentence(t, "are", "you", "sure", "you", "want", "to", "activate", "this", "emailTemplate") + "?"
              : buildSentence(t, "are", "you", "sure", "you", "want", "to", "deactivate", "this", "emailTemplate") + "?"
          }
          footerContent={
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={activateMutation.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={activateMutation.isPending}
              >
                {activateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isActivating
                  ? buildSentence(t, "activate")
                  : buildSentence(t, "deactivate")}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 py-4">
            <div className="text-sm">
              <div className="font-medium mb-2">{template.name}</div>
              <div className="text-muted-foreground">
                <div>{template.identifier}</div>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-500 mt-2">{error}</div>
            )}
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

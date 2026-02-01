// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useTransition, useState } from "react";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IMembership } from "@shared/interfaces/membership.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Label } from "@/components/ui/label";
import { QuillEditor } from "@/components/shared-ui/quill-editor";

// Services
import { updateMembership } from "@/services/membership/membership.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";
import type { TUpdateMembershipData } from "@shared/types/membership.type";

type IMembershipTermsAndConditionsProps = THandlerComponentProps<
  TSingleHandlerStore<IMembership, any>
>;

export default function MembershipTermsAndConditions({ storeKey, store }: IMembershipTermsAndConditionsProps) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [termsAndConditions, setTermsAndConditions] = useState<string>("");
  const { t } = useI18n();

  const selector = useShallow(
    (state: ISingleHandlerState<IMembership, any>) => ({
      action: state.action,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;
  const membership = storeState?.response;

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      setError(null);
      setTermsAndConditions("");
      storeState.reset();
      storeState.setAction("none");
    });
  }, [storeState, startTransition]);

  const updateTermsMutation = useApiMutation(
    async ({ id, termsAndConditions }: { id: string; termsAndConditions?: string }) => {
      const result = await updateMembership(id)({ termsAndConditions } as TUpdateMembershipData);
      return result;
    },
    {
      onSuccess: () => {
        startTransition(() => {
          queryClient.invalidateQueries({ queryKey: [storeKey] });
          queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
          handleClose();
        });
      },
      onError: (error: Error) => {
        startTransition(() => {
          setError(error?.message || buildSentence(t, "failed", "to", "update", "terms", "and", "conditions"));
        });
      },
    }
  );

  const handleConfirm = useCallback(() => {
    if (!membership?.id) return;
    updateTermsMutation.mutate({ id: membership.id, termsAndConditions });
  }, [membership, termsAndConditions, updateTermsMutation]);

  // Initialize values when membership changes and action is open
  useMemo(() => {
    if (membership?.termsAndConditions && storeState?.action === "updateTermsAndConditions") {
      setTermsAndConditions(membership.termsAndConditions);
    }
  }, [membership?.termsAndConditions, storeState?.action]);

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!membership) {
    return null;
  }

  const { action } = storeState!;
  const isOpen = action === "updateTermsAndConditions";

  if (!isOpen) {
    return null;
  }

  const title = buildSentence(t, "terms", "and", "conditions");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <AppDialog
          title={<DialogTitle>{title}</DialogTitle>}
          footerContent={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateTermsMutation.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleConfirm}
                disabled={updateTermsMutation.isPending}
              >
                {updateTermsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {buildSentence(t, "save")}
              </Button>
            </>
          }
        >
          <div className="space-y-3 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label>{buildSentence(t, "terms", "and", "conditions")}</Label>
              <QuillEditor
                value={termsAndConditions}
                onChange={setTermsAndConditions}
                placeholder={buildSentence(t, "enter", "terms", "and", "conditions")}
                minHeight="300px"
              />
            </div>
            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

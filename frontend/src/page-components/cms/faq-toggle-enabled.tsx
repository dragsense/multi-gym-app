// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useCallback, useTransition } from "react";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IFaq } from "@shared/interfaces/cms.interface";
import type { TUpdateFaqData } from "@shared/types/cms.type";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/layout-ui/app-dialog";

// Services
import { updateFaq } from "@/services/cms.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { toast } from "sonner";

type IFaqToggleEnabledProps = THandlerComponentProps<
  TSingleHandlerStore<IFaq, any>
>;

export default function FaqToggleEnabled({ storeKey, store }: IFaqToggleEnabledProps) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const selector = useShallow(
    (state: ISingleHandlerState<IFaq, any>) => ({
      action: state.action,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;
  const faq = storeState?.response;

  const mutation = useMutation({
    mutationFn: (data: TUpdateFaqData) => {
      if (!faq?.id) throw new Error("FAQ ID is required");
      return updateFaq(faq.id)(data);
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: [storeKey] });
        queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
        toast.success(buildSentence(t, "faq", "status", "updated", "successfully"));
        if (storeState) {
          storeState.reset();
          storeState.setAction("none");
        }
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.message || buildSentence(t, "failed", "to", "update", "faq", "status"),
      );
    },
  });

  const handleConfirm = useCallback(() => {
    if (!faq?.id) return;
    mutation.mutate({ enabled: !faq.enabled } as TUpdateFaqData);
  }, [faq, mutation]);

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      storeState.reset();
      storeState.setAction("none");
    });
  }, [storeState, startTransition]);

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!faq) {
    return null;
  }

  const { action } = storeState!;
  const isOpen = action === "toggleEnabled";

  if (!isOpen) {
    return null;
  }

  const title = faq.enabled
    ? buildSentence(t, "disable", "faq")
    : buildSentence(t, "enable", "faq");

  const description = faq.enabled
    ? buildSentence(t, "areyousureyouwanttodisablethisfaq")
    : buildSentence(t, "areyousureyouwanttoenablethisfaq");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <AppDialog
          title={<DialogTitle>{title}</DialogTitle>}
          description={description}
          footerContent={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleConfirm}
                disabled={mutation.isPending}
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {buildSentence(t, "confirm")}
              </Button>
            </>
          }
        >
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {buildSentence(t, "question")}: {faq.question}
            </p>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

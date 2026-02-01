// External Libraries
import { useId, useTransition, useCallback, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TSingleHandlerStore } from "@/stores";
import { type IBilling } from "@shared/interfaces/billing.interface";
import { EBillingStatus } from "@shared/enums/billing.enum";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Services
import { updateBillingStatus } from "@/services/billing.api";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TBillingCashPaymentExtraProps = Record<string, unknown>;

type IBillingCashPaymentProps = THandlerComponentProps<
  TSingleHandlerStore<IBilling, TBillingCashPaymentExtraProps>
>;

export default function BillingCashPayment({
  storeKey,
  store,
}: IBillingCashPaymentProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const [message, setMessage] = useState("");

  const { action, payload, setAction } = store(
    useShallow((state) => ({
      action: state.action,
      payload: state.payload,
      setAction: state.setAction,
    }))
  );

  const billingId = payload as string | null;
  const open = action === "cashPayment" && !!billingId;

  const handleClose = useCallback(() => {
    startTransition(() => {
      setAction("none");
      setMessage("");
    });
  }, [setAction]);

  const { mutate: markAsPaid, isPending } = useMutation({
    mutationFn: (data: { status: string; message?: string }) =>
      updateBillingStatus(billingId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
      queryClient.invalidateQueries({ queryKey: [storeKey] });
      handleClose();
    },
  });

  const handleConfirm = () => {
    markAsPaid({
      status: EBillingStatus.PAID,
      message: message || "Paid via cash",
    });
  };

  if (!billingId) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      data-component-id={componentId}
    >
      <DialogContent className="sm:max-w-md">
        <AppDialog
          title={buildSentence(t, "mark", "as", "paid")}
          description={buildSentence(
            t,
            "confirm",
            "cash",
            "payment",
            "for",
            "this",
            "billing"
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
                  : buildSentence(t, "confirm", "payment")}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-message">
                {buildSentence(t, "payment", "note")} ({t("optional")})
              </Label>
              <Textarea
                id="payment-message"
                placeholder={buildSentence(t, "e.g.", "paid", "via", "cash")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

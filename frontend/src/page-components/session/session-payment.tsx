// External Libraries
import { useShallow } from "zustand/shallow";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useTransition } from "react";
import { useMutation } from "@tanstack/react-query";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISession } from "@shared/interfaces/session.interface";
import type { TSessionPaymentIntentData } from "@shared/types/session.type";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { PaymentModalAdapter } from "@/payment-processors";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";

// Services
import { createSessionPaymentIntent } from "@/services/session-billing.api";

// Hooks
import { usePaymentCards } from "@/hooks/use-payment-cards";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { PaymentCardFormData } from "@/@types/payment.types";

export type TSessionPaymentExtraProps = Record<string, unknown>;

type ISessionPaymentProps = THandlerComponentProps<
  TSingleHandlerStore<ISession, TSessionPaymentExtraProps>
>;

export default function SessionPayment({
  storeKey,
  store,
}: ISessionPaymentProps) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const selector = useShallow(
    (state: ISingleHandlerState<ISession, TSessionPaymentExtraProps>) => ({
      action: state.action,
      extra: state.extra,
      payload: state.payload,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;
  const session = storeState?.response;
  const memberId = storeState?.extra?.memberId as string;

  console.log("CLIENT ID", memberId);

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      storeState.reset();
      storeState.setAction("none");
      setError(null);
      setShowSuccessDialog(false);
      setShowErrorDialog(false);
      setErrorMessage("");
    });
  }, [storeState, startTransition]);

  const { cards, isLoadingPaymentCards, errorPaymentCards } =
    usePaymentCards();

  const { mutate: processPayment, isPending: isProcessingPayment } =
    useMutation({
      mutationFn: (data: TSessionPaymentIntentData) =>
        createSessionPaymentIntent(data),
      onSuccess: () => {
        setShowSuccessDialog(true);
        queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
        queryClient.invalidateQueries({ queryKey: [storeKey] });
      },
      onError: (error: Error) => {
        const message = error?.message || buildSentence(t, "payment", "failed");
        setErrorMessage(message);
        setShowErrorDialog(true);
      },
    });

  const handlePayClick = useCallback(
    async (paymentMethodId: string, cardData?: PaymentCardFormData) => {
      if (!session) {
        setErrorMessage(buildSentence(t, "session", "not", "found"));
        setShowErrorDialog(true);
        return;
      }

      if (!memberId) {
        setErrorMessage(
          buildSentence(t, "no", "member", "associated", "with", "session")
        );
        setShowErrorDialog(true);
        return;
      }

      const paymentData: TSessionPaymentIntentData = {
        sessionId: session.id,
        memberId: memberId,
        paymentMethodId,
        saveForFutureUse: cardData?.saveForFutureUse || false,
        setAsDefault: cardData?.saveAsDefault || false,
      };

      processPayment(paymentData);
    },
    [session, processPayment, t, memberId]
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
      <PaymentModalAdapter
        open={action === "pay" && !showSuccessDialog && !showErrorDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
        cards={cards}
        onPay={handlePayClick}
        isLoading={isLoadingPaymentCards || isProcessingPayment}
        amount={session.price}
        error={error || errorPaymentCards?.message}
      />

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <AppDialog
            title={buildSentence(t, "payment", "successful")}
            description={buildSentence(
              t,
              "Your payment",
              "has",
              "been",
              "processed",
              "successfully"
            )}
            footerContent={
              <Button
                onClick={() => {
                  setShowSuccessDialog(false);
                  handleClose();
                }}
              >
                {t("ok")}
              </Button>
            }
          >
            <div />
          </AppDialog>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <AppDialog
            title={buildSentence(t, "payment", "error")}
            description={errorMessage || buildSentence(t, "payment", "failed")}
            footerContent={
              <Button
                variant="destructive"
                onClick={() => {
                  setShowErrorDialog(false);
                  setErrorMessage("");
                }}
              >
                {t("close")}
              </Button>
            }
          >
            <div />
          </AppDialog>
        </DialogContent>
      </Dialog>
    </>
  );
}

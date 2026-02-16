// External Libraries
import { useShallow } from "zustand/shallow";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useTransition } from "react";
import { useMutation } from "@tanstack/react-query";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IBilling } from "@shared/interfaces/billing.interface";
import type { TBillingPaymentIntentData } from "@shared/types/billing.type";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { StripePaymentModal } from "@/components/shared-ui/stripe-payment-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";

// Services
import { createBillingPaymentIntent } from "@/services/billing.api";

// Hooks
import { useStripePaymentCards } from "@/hooks/use-stripe-payment-cards";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { StripeCardFormData } from "@/@types/payment.types";

export type TBillingPaymentExtraProps = Record<string, unknown>;

type IBillingPaymentProps = THandlerComponentProps<
    TSingleHandlerStore<IBilling, TBillingPaymentExtraProps>
>;

export default function BillingPayment({
    storeKey,
    store,
}: IBillingPaymentProps) {
    const [, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const { t } = useI18n();
    const [paymentFinished, setPaymentFinished] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");


    const selector = useShallow(
        (state: ISingleHandlerState<IBilling, TBillingPaymentExtraProps>) => ({
            action: state.action,
            response: state.response,
            setAction: state.setAction,
            reset: state.reset,
        })
    );

    const storeState = store ? store(selector) : null;
    const billing = storeState?.response;



//  Old Method to close the modal -------------------------
//    const handleClose = useCallback(() => {
//        if (!storeState) return;
//        startTransition(() => {
//            storeState.reset();
//            storeState.setAction("none");
//            setError(null);
//            setShowSuccessDialog(false);
//            setShowErrorDialog(false);
//            setErrorMessage("");
//        });
//    }, [storeState, startTransition]);
//
    
//New Method to close the Modal to aviod recall reopen of modal
    const resetPaymentFlow = useCallback(() => {
    setShowSuccessDialog(false);
    setShowErrorDialog(false);
    setErrorMessage("");
    setError(null);
    setPaymentFinished(false);

    storeState?.setAction("none");
    storeState?.reset();}, [storeState]);
//-------------------------------------------------------------

    const { stripeCards, isLoadingPaymentCards, errorPaymentCards } =
        useStripePaymentCards();

    const { mutate: processPayment, isPending: isProcessingPayment } =
        useMutation({
            mutationFn: (data: TBillingPaymentIntentData) =>
                createBillingPaymentIntent(data),
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
        async (paymentMethodId: string, cardData?: StripeCardFormData) => {
            if (!billing) {
                setErrorMessage(buildSentence(t, "billing", "not", "found"));
                setShowErrorDialog(true);
                return;
            }



            const paymentData: TBillingPaymentIntentData = {
                billingId: billing.id,
                paymentMethodId,
                saveForFutureUse: cardData?.saveForFutureUse || false,
                setAsDefault: cardData?.saveAsDefault || false,
            };

            processPayment(paymentData);
        },
        [billing, processPayment, t]
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

    if (!billing) {
        return null;
    }

    const { action } = storeState!;

    return (
        <>
            <StripePaymentModal
                open={action === "pay" && !showSuccessDialog && !showErrorDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        resetPaymentFlow();
                    }
                }}
                stripeCards={stripeCards}
                onPay={handlePayClick}
                isLoading={isLoadingPaymentCards || isProcessingPayment}
                amount={billing.totalAmount}
                error={error || errorPaymentCards?.message}
            />

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={(open) => {if (!open) {resetPaymentFlow();}}}>
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
                                onClick={resetPaymentFlow}
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
            <Dialog open={showErrorDialog} onOpenChange={(open) => { if (!open) {   resetPaymentFlow(); }}}>
                <DialogContent>
                    <AppDialog
                        title={buildSentence(t, "payment", "error")}
                        description={errorMessage || buildSentence(t, "payment", "failed")}
                        footerContent={
                            <Button
                                variant="destructive"
                                onClick={resetPaymentFlow}
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

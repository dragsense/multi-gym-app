// External Libraries
import { useShallow } from "zustand/shallow";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IBusiness, type IProfile } from "@shared/interfaces";
import type { TBusinessPaymentIntentData } from "@shared/types";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { StripePaymentModal } from "@/components/shared-ui/stripe-payment-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";

// Services
import { createBusinessPaymentIntent } from "@/services/business-billing.api";

// Hooks
import { useStripePaymentCards } from "@/hooks/use-stripe-payment-cards";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { StripeCardFormData } from "@/@types/payment.types";
import type { ESubscriptionFrequency } from "@shared/enums";

export type TBusinessPaymentExtraProps = Record<string, unknown>;

type IBusinessPaymentProps = THandlerComponentProps<
    TSingleHandlerStore<IProfile, TBusinessPaymentExtraProps>
>;

export default function BusinessPayment({
    storeKey,
    store,
}: IBusinessPaymentProps) {
    const [, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { t } = useI18n();

    const [error, setError] = useState<string | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const selector = useShallow(
        (state: ISingleHandlerState<IProfile, TBusinessPaymentExtraProps>) => ({
            action: state.action,
            extra: state.extra,
            payload: state.payload,
            response: state.response,
            setAction: state.setAction,
            reset: state.reset,
        })
    );

    const storeState = store ? store(selector) : null;
    const profileId = storeState?.extra?.profileId as string;
    const business = storeState?.extra?.business as IBusiness;
    const finalPrice = storeState?.extra?.finalPrice as number;

    console.log("PROFILE ID", profileId);

    const handleClose = useCallback(() => {
        if (!storeState) return;
        startTransition(() => {
            storeState.setAction("none");
            setError(null);
            setShowSuccessDialog(false);
            setShowErrorDialog(false);
            setErrorMessage("");
        });
    }, [storeState, startTransition]);

    const { stripeCards, isLoadingPaymentCards, errorPaymentCards } =
        useStripePaymentCards();

    const { mutate: processPayment, isPending: isProcessingPayment } =
        useMutation({
            mutationFn: (data: TBusinessPaymentIntentData) =>
                createBusinessPaymentIntent(data),
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
            if (!business) {
                setErrorMessage(buildSentence(t, "business", "not", "found"));
                setShowErrorDialog(true);
                return;
            }

            if (!profileId) {
                setErrorMessage(
                    buildSentence(t, "no", "user", "associated", "with", "business")
                );
                setShowErrorDialog(true);
                return;
            }

            const paymentData: TBusinessPaymentIntentData = {
                businessId: business.id,
                profileId: profileId,
                paymentMethodId,
                saveForFutureUse: cardData?.saveForFutureUse || false,
                setAsDefault: cardData?.saveAsDefault || false,
            };

            processPayment(paymentData);
        },
        [business, processPayment, t, profileId]
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

    if (!business || !profileId) {
        return null;
    }

    const { action } = storeState!;



    return (
        <>
            <StripePaymentModal
                open={action === "payBusiness" && !showSuccessDialog && !showErrorDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        handleClose();
                    }
                }}
                stripeCards={stripeCards}
                onPay={handlePayClick}
                isLoading={isLoadingPaymentCards || isProcessingPayment}
                amount={finalPrice}
                error={error || errorPaymentCards?.message}
            />

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent>
                    <AppDialog
                        title={buildSentence(t, "payment", "successful")}
                        description={buildSentence(
                            t,
                            "your",
                            "payment",
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
                                    navigate("/");
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

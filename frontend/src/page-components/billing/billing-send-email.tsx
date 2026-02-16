// External Libraries
import { useId, useTransition, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Loader2 } from "lucide-react";
import { useShallow } from 'zustand/shallow';

// Types
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import { type TListHandlerStore } from "@/stores";
import { type IBilling } from "@shared/interfaces/billing.interface";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Services
import { sendBillingEmail } from "@/services/billing.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TBillingSendEmailExtraProps = Record<string, any>;

interface IBillingSendEmailProps extends TListHandlerComponentProps<TListHandlerStore<IBilling, Record<string, any>, TBillingSendEmailExtraProps>> {
}

export default function BillingSendEmail({
    storeKey,
    store,
}: IBillingSendEmailProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const { t } = useI18n();
    const [isSending, setIsSending] = useState(false);

    const { action, payload, setAction } = store(useShallow(state => ({
        action: state.action,
        payload: state.payload,
        setAction: state.setAction,
    })));

    const billingId = payload as string;

    const handleClose = () => {
        startTransition(() => {
            setAction('', null);
        });
    };

    const handleSendEmail = async () => {
        if (!billingId) return;

        setIsSending(true);
        try {
            await sendBillingEmail(billingId);
            toast.success(buildSentence(t, 'sent', 'successfully'));
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
            handleClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : buildSentence(t, 'failed', 'to', 'send'));
        } finally {
            setIsSending(false);
        }
    };

    if (!billingId) {
        return null;
    }

    return (
        <Dialog open={action === 'sendEmail'} onOpenChange={handleClose} data-component-id={componentId}>
            <DialogContent className="min-w-md">
                <AppDialog
                    title={buildSentence(t, 'send', 'email')}
                    description={buildSentence(t, 'send', 'email')}
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                <strong>{t('billing')} ID:</strong> {billingId}
                            </p>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSending}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={handleSendEmail}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('sending')}
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        {buildSentence(t, 'send', 'email')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}


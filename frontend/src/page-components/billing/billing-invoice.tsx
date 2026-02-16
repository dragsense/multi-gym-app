// External Libraries
import { useId, useTransition, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TSingleHandlerStore } from "@/stores";
import { type IBilling } from "@shared/interfaces/billing.interface";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";

// Services
import {
  downloadBillingInvoicePdf,
  fetchBillingInvoiceHtml,
} from "@/services/billing.api";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TBillingInvoiceExtraProps = Record<string, unknown>;

type IBillingInvoiceProps = THandlerComponentProps<
  TSingleHandlerStore<IBilling, TBillingInvoiceExtraProps>
>;

export default function BillingInvoice({ store }: IBillingInvoiceProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const { action, payload, setAction } = store(
    useShallow((state) => ({
      action: state.action,
      payload: state.payload,
      setAction: state.setAction,
    }))
  );

  const billingId = payload as string | null;

  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const open = action === "invoice" && !!billingId;

  const handleClose = () => {
    startTransition(() => {
      setAction("none");
    });
  };

  // Fetch invoice HTML when opened
  useEffect(() => {
    if (!open || !billingId) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const text = await fetchBillingInvoiceHtml(billingId);
        if (!cancelled) {
          setHtml(text);
        }
      } catch {
        if (!cancelled) {
          setHtml("");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, billingId]);

  if (!billingId) {
    return null;
  }

  const handleDownloadPdf = () => {
    downloadBillingInvoicePdf(billingId);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      data-component-id={componentId}
    >
      <DialogContent className="sm:max-w-5xl">
        <AppDialog
          title={buildSentence(t, "billing", "invoice")}
          description={buildSentence(
            t,
            "preview",
            "and",
            "download",
            "invoice"
          )}
          footerContent={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t("close")}
              </Button>
              <Button onClick={handleDownloadPdf}>
                {buildSentence(t, "download", "pdf")}
              </Button>
            </div>
          }
        >
          <div className="border rounded-md h-[60vh] overflow-auto bg-muted">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {buildSentence(t, "loading", "invoice")}
              </div>
            ) : html ? (
              <iframe
                title="Invoice Preview"
                srcDoc={html}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {buildSentence(t, "no", "invoice", "available")}
              </div>
            )}
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

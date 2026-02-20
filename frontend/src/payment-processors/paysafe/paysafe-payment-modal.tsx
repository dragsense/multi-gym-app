import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatCurrency } from "@/lib/utils";
import { getPaysafeSetup } from "@/services/paysafe.api";
import { fetchPaymentCards } from "@/services/payment-adapter.api";
import { toast } from "sonner";
import type { PaymentModalProps } from "@/@types/payment-processor.types";

const PAYSAFE_SCRIPT_URL = "https://hosted.paysafe.com/js/v1/latest/paysafe.min.js";

declare global {
  interface Window {
    paysafe?: {
      fields: {
        setup: (
          apiKey: string,
          options: {
            currencyCode: string;
            environment: string;
            fields: {
              cardNumber: { selector: string; placeholder?: string };
              expiryDate: { selector: string; placeholder?: string };
              cvv: { selector: string; placeholder?: string };
            };
          }
        ) => Promise<{
          show: () => Promise<{ card?: { error?: unknown } }>;
          tokenize: (opts: {
            amount: number;
            transactionType: string;
            paymentType: string;
            merchantRefNum: string;
          }) => Promise<{ token: string }>;
        }>;
      };
    };
  }
}

export interface PaysafePaymentModalProps extends PaymentModalProps {}

export function PaysafePaymentModal({
  open,
  onOpenChange,
  onPay,
  isLoading = false,
  amount,
  error,
}: PaysafePaymentModalProps) {
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const [mode, setMode] = useState<"saved" | "new">("new");
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instanceReady, setInstanceReady] = useState(false);
  const instanceRef = useRef<{
    show: () => Promise<{ card?: { error?: unknown } }>;
    tokenize: (opts: {
      amount: number;
      transactionType: string;
      paymentType: string;
      merchantRefNum: string;
    }) => Promise<{ token: string }>;
  } | null>(null);

  const { data: setup, isLoading: isLoadingSetup } = useQuery({
    queryKey: ["paysafe-setup"],
    queryFn: getPaysafeSetup,
    enabled: open && mode === "new",
    retry: false,
  });

  const {
    data: savedCards,
    isLoading: isLoadingSavedCards,
  } = useQuery({
    queryKey: ["paysafe-payment-cards"],
    queryFn: fetchPaymentCards,
    enabled: open,
    retry: false,
  });

  const savedPaymentMethods = savedCards?.paymentMethods ?? [];
  const savedDefaultId = savedCards?.defaultPaymentMethodId ?? null;

  useEffect(() => {
    if (!open) return;
    if (savedPaymentMethods.length > 0) {
      setMode("saved");
      setSelectedSavedId((prev) => prev ?? savedDefaultId ?? savedPaymentMethods[0]?.id ?? null);
    } else {
      setMode("new");
      setSelectedSavedId(null);
    }
  }, [open, savedDefaultId, savedPaymentMethods]);

  useEffect(() => {
    if (!open) return;
    if (mode !== "new") return;
    if (document.querySelector(`script[src="${PAYSAFE_SCRIPT_URL}"]`)) {
      setScriptLoaded(!!window.paysafe);
      return;
    }
    const script = document.createElement("script");
    script.src = PAYSAFE_SCRIPT_URL;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      toast.error("Failed to load payment form");
      setScriptLoaded(false);
    };
    document.head.appendChild(script);
  }, [open]);

  const initPaysafe = useCallback(async () => {
    if (!window.paysafe?.fields?.setup || !setup) return null;
    const instance = await window.paysafe.fields.setup(setup.singleUseTokenApiKey, {
      currencyCode: "USD",
      environment: setup.environment,
      fields: {
        cardNumber: { selector: "#paysafe-card-number", placeholder: "Card number" },
        expiryDate: { selector: "#paysafe-expiry", placeholder: "MM/YY" },
        cvv: { selector: "#paysafe-cvv", placeholder: "CVV" },
      },
    });
    const paymentMethods = await instance.show();
    if (paymentMethods?.card?.error) {
      toast.error("Card fields could not be loaded");
      return null;
    }
    return instance;
  }, [setup]);

  useEffect(() => {
    if (!open || mode !== "new" || !scriptLoaded || !setup) {
      setInstanceReady(false);
      instanceRef.current = null;
      return;
    }
    let cancelled = false;
    setInstanceReady(false);
    initPaysafe().then((instance) => {
      if (!cancelled && instance) {
        instanceRef.current = instance;
        setInstanceReady(true);
      }
    });
    return () => {
      cancelled = true;
      instanceRef.current = null;
      setInstanceReady(false);
    };
  }, [open, scriptLoaded, setup, initPaysafe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLoading || !amount || amount <= 0) return;

    if (mode === "saved") {
      if (!selectedSavedId) {
        toast.error("Please select a saved card");
        return;
      }
      setIsSubmitting(true);
      try {
        await onPay(selectedSavedId);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const instance = instanceRef.current;
    if (!instance) {
      toast.error("Payment form not ready");
      return;
    }
    setIsSubmitting(true);
    try {
      const amountMinor = Math.round(amount * 100);
      const result = await instance.tokenize({
        amount: amountMinor,
        transactionType: "PAYMENT",
        paymentType: "CARD",
        merchantRefNum: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      });
      if (result?.token) {
        await onPay(result.token);
      } else {
        toast.error("Failed to get payment token");
      }
    } catch (err) {
      const message =
        err && typeof err === "object" && "displayMessage" in err
          ? String((err as { displayMessage: string }).displayMessage)
          : err instanceof Error
            ? err.message
            : "Payment failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ready =
    mode === "saved"
      ? !!selectedSavedId
      : scriptLoaded && setup && instanceReady;

  const titleNode = (
    <div className="flex items-center justify-between mt-2">
      <span>{t("payment")}</span>
      {amount != null && amount > 0 && (
        <span className="text-lg font-semibold text-primary">
          {formatCurrency(amount, undefined, undefined, 2, 2, settings)}
        </span>
      )}
    </div>
  );

  const footerContent = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting || isLoading}
      >
        {t("cancel")}
      </Button>
      <Button type="submit" form="paysafe-payment-form" disabled={!ready || isSubmitting || isLoading}>
        {isSubmitting || isLoading
          ? t("processing") + "..."
          : t("pay") +
            (amount != null && amount > 0
              ? ` ${formatCurrency(amount, undefined, undefined, 2, 2, settings)}`
              : "")}
      </Button>
    </div>
  );

  const content =
    isLoadingSavedCards ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : savedPaymentMethods.length > 0 ? (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={mode === "saved" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("saved")}
          >
            Saved card
          </Button>
          <Button
            type="button"
            variant={mode === "new" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("new")}
          >
            New card
          </Button>
        </div>

        {mode === "saved" ? (
          <div className="space-y-3">
            {savedPaymentMethods.map((pm) => (
              <label
                key={pm.id}
                className="flex items-center justify-between p-3 rounded-md border cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paysafe-saved-card"
                    checked={selectedSavedId === pm.id}
                    onChange={() => setSelectedSavedId(pm.id)}
                  />
                  <div className="text-sm">
                    <div className="font-medium">
                      {pm.card?.brand ?? "Card"} •••• {pm.card?.last4 ?? "0000"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Expires {pm.card?.exp_month}/{pm.card?.exp_year}
                      {pm.id === savedDefaultId ? " (default)" : ""}
                    </div>
                  </div>
                </div>
              </label>
            ))}
            <p className="text-xs text-muted-foreground">
              Saved card payments may not require CVV. If your account requires CVV, you’ll be asked for it.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : isLoadingSetup || (!scriptLoaded && open) ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !setup ? (
          <p className="text-sm text-muted-foreground py-4">
            Paysafe is not configured. Please contact support.
          </p>
        ) : (
          <form
            id="paysafe-payment-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Card number</label>
              <div
                id="paysafe-card-number"
                className="min-h-[40px] border rounded-md px-3 py-2 bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry</label>
                <div
                  id="paysafe-expiry"
                  className="min-h-[40px] border rounded-md px-3 py-2 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CVV</label>
                <div
                  id="paysafe-cvv"
                  className="min-h-[40px] border rounded-md px-3 py-2 bg-background"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        )}
      </div>
    ) : isLoadingSetup || (!scriptLoaded && open) ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : !setup ? (
      <p className="text-sm text-muted-foreground py-4">
        Paysafe is not configured. Please contact support.
      </p>
    ) : (
      <form id="paysafe-payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Card number</label>
          <div
            id="paysafe-card-number"
            className="min-h-[40px] border rounded-md px-3 py-2 bg-background"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Expiry</label>
            <div
              id="paysafe-expiry"
              className="min-h-[40px] border rounded-md px-3 py-2 bg-background"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CVV</label>
            <div
              id="paysafe-cvv"
              className="min-h-[40px] border rounded-md px-3 py-2 bg-background"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <AppDialog title={titleNode} footerContent={footerContent}>
          {content}
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

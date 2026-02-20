import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2 } from "lucide-react";

import { getPaysafeSetup } from "@/services/paysafe.api";

const PAYSAFE_SCRIPT_URL =
  "https://hosted.paysafe.com/js/v1/latest/paysafe.min.js";

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

interface AddPaysafeCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (paymentMethodId: string, setAsDefault: boolean) => void;
  isLoading?: boolean;
}

export function AddPaysafeCardModal({
  open,
  onOpenChange,
  onAddCard,
  isLoading = false,
}: AddPaysafeCardModalProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [instanceReady, setInstanceReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);

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
    enabled: open,
    retry: false,
  });

  useEffect(() => {
    if (!open) return;
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
    const instance = await window.paysafe.fields.setup(
      setup.singleUseTokenApiKey,
      {
        currencyCode: "USD",
        environment: setup.environment,
        fields: {
          cardNumber: { selector: "#paysafe-add-card-number", placeholder: "Card number" },
          expiryDate: { selector: "#paysafe-add-expiry", placeholder: "MM/YY" },
          cvv: { selector: "#paysafe-add-cvv", placeholder: "CVV" },
        },
      }
    );
    const paymentMethods = await instance.show();
    if (paymentMethods?.card?.error) {
      toast.error("Card fields could not be loaded");
      return null;
    }
    return instance;
  }, [setup]);

  useEffect(() => {
    if (!open || !scriptLoaded || !setup) {
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
    if (isSubmitting || isLoading) return;
    const instance = instanceRef.current;
    if (!instance) {
      toast.error("Card form not ready");
      return;
    }
    setIsSubmitting(true);
    try {
      // Tokenize only (no charge). Amount must be >= 1 in minor units.
      const result = await instance.tokenize({
        amount: 1,
        transactionType: "PAYMENT",
        paymentType: "CARD",
        merchantRefNum: `save-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      });

      if (!result?.token) {
        toast.error("Failed to tokenize card");
        return;
      }

      onAddCard(result.token, setAsDefault);
      onOpenChange(false);
    } catch (err) {
      const message =
        err && typeof err === "object" && "displayMessage" in err
          ? String((err as { displayMessage: string }).displayMessage)
          : err instanceof Error
            ? err.message
            : "Failed to add card";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content =
    isLoadingSetup || (!scriptLoaded && open) ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : !setup ? (
      <p className="text-sm text-muted-foreground py-4">
        Paysafe is not configured. Please contact support.
      </p>
    ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Card number</Label>
          <div
            id="paysafe-add-card-number"
            className="min-h-[40px] border rounded-md px-3 py-2 bg-background"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Expiry</Label>
            <div
              id="paysafe-add-expiry"
              className="min-h-[40px] border rounded-md px-3 py-2 bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>CVV</Label>
            <div
              id="paysafe-add-cvv"
              className="min-h-[40px] border rounded-md px-3 py-2 bg-background"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="paysafe-set-default"
            checked={setAsDefault}
            onCheckedChange={(v) => setSetAsDefault(Boolean(v))}
          />
          <Label
            htmlFor="paysafe-set-default"
            className="text-sm font-normal cursor-pointer"
          >
            Set as default payment method
          </Label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || isSubmitting || !instanceReady}
            className="min-w-[120px]"
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              "Add Card"
            )}
          </Button>
        </div>
      </form>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <AppDialog
          title={
            <DialogTitle className="flex items-center gap-2 mt-2">
              <CreditCard className="h-5 w-5" />
              <span>Add New Card</span>
            </DialogTitle>
          }
        >
          {content}
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}


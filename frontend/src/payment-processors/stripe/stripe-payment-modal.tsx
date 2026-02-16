import { useState, useEffect } from "react";
import {
  useForm,
  Controller,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { CreditCard, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/hooks/use-i18n";
import { cn, formatCurrency } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";
import type {
  StripePaymentCard,
  StripeCardFormData,
} from "@/@types/payment.types";
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { AppCard } from "@/components/layout-ui/app-card";
import { useStripeConnect } from "@/hooks/use-stripe-connect";
import type { PaymentModalProps } from "../types";

function StripeCardsList({
  cards,
  selectedCardId,
  onSelectCard,
  className,
}: {
  cards: StripePaymentCard[];
  selectedCardId?: string;
  onSelectCard: (id: string) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const formatCardNumber = (last4: string) => `**** **** **** ${last4}`;
  const formatExpiry = (month: number, year: number) =>
    `${month.toString().padStart(2, "0")}/${year.toString().slice(-2)}`;

  return (
    <div className={cn("space-y-4", className)}>
      {cards.map((card) => (
        <AppCard
          key={card.id}
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            selectedCardId === card.id && "border-primary ring-2 ring-primary"
          )}
          onClick={() => onSelectCard(card.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{formatCardNumber(card.last4)}</p>
                  {card.isDefault && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      {t("default")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="capitalize">{card.brand}</span>
                  <span>•</span>
                  <span>{formatExpiry(card.expiryMonth, card.expiryYear)}</span>
                  {card.cardholderName && (
                    <>
                      <span>•</span>
                      <span>{card.cardholderName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {selectedCardId === card.id && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
        </AppCard>
      ))}
    </div>
  );
}

function StripeCardForm({
  showSaveOptions = true,
  className,
}: {
  showSaveOptions?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const stripe = useStripe();
  const elements = useElements();
  const { control, watch, setValue } = useFormContext<StripeCardFormData>();
  const saveForFutureUse = watch("saveForFutureUse");

  if (!stripe || !elements) {
    return (
      <div className={cn("space-y-4", className)}>
        <p className="text-sm text-muted-foreground">{t("loading")}...</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="p-4 border rounded-md">
        <CardElement />
      </div>
      {showSaveOptions && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Controller
              name="saveForFutureUse"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="saveForFutureUse"
                  checked={field.value || false}
                  onCheckedChange={(checked) => {
                    field.onChange(!!checked);
                    if (!checked) setValue("saveAsDefault", false);
                  }}
                />
              )}
            />
            <Label htmlFor="saveForFutureUse" className="text-sm font-normal cursor-pointer">
              {t("save")} {t("for")} {t("future")} {t("use")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Controller
              name="saveAsDefault"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="saveAsDefault"
                  checked={field.value || false}
                  disabled={!saveForFutureUse}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
              )}
            />
            <Label
              htmlFor="saveAsDefault"
              className={cn(
                "text-sm font-normal",
                !saveForFutureUse && "text-muted-foreground cursor-not-allowed",
                saveForFutureUse && "cursor-pointer"
              )}
            >
              {t("save")} {t("as")} {t("default")}
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}

interface StripePaymentModalContentProps {
  stripeCards: StripePaymentCard[];
  onPay: (paymentMethodId?: string, cardData?: StripeCardFormData) => void | Promise<void>;
  isLoading: boolean;
  amount?: number;
  onOpenChange: (open: boolean) => void;
  formMethods: ReturnType<typeof useForm<StripeCardFormData>>;
  error?: string;
  showSaveOptions?: boolean;
}

function StripePaymentModalContent({
  stripeCards,
  onPay,
  isLoading,
  amount,
  onOpenChange,
  formMethods,
  error,
  showSaveOptions = true,
}: StripePaymentModalContentProps) {
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const stripe = useStripe();
  const elements = useElements();
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string>(
    stripeCards.length > 0 ? "saved-cards" : "new-card"
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLoading) return;
    if (!stripe || !elements) {
      toast.error("Payment system not ready");
      return;
    }
    setIsSubmitting(true);
    try {
      if (selectedPaymentMethodId) {
        await onPay(selectedPaymentMethodId);
      } else {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error("Card form not found");
          setIsSubmitting(false);
          return;
        }
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        });
        if (pmError || !paymentMethod) {
          toast.error(pmError?.message || "Failed to create payment method");
          setIsSubmitting(false);
          return;
        }
        const saveAsDefault = formMethods.getValues("saveAsDefault");
        const saveForFutureUse = formMethods.getValues("saveForFutureUse");
        await onPay(paymentMethod.id, { saveAsDefault, saveForFutureUse });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPay = selectedPaymentMethodId || accordionValue === "new-card";

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
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || isLoading}>
        {t("cancel")}
      </Button>
      <Button type="submit" form="stripe-payment-form" disabled={!canPay || isLoading || isSubmitting} className="min-w-[120px]">
        {isLoading || isSubmitting ? t("processing") + "..." : t("pay")}{" "}
        {amount != null && amount > 0 && formatCurrency(amount, undefined, undefined, 2, 2, settings)}
      </Button>
    </div>
  );

  return (
    <AppDialog title={titleNode} footerContent={footerContent}>
      <FormProvider {...formMethods}>
        <form id="stripe-payment-form" onSubmit={handleFormSubmit} className="space-y-4">
          <Accordion
            type="single"
            value={accordionValue}
            onValueChange={(value) => {
              setSelectedPaymentMethodId(undefined);
              if (value === undefined) {
                setAccordionValue(
                  accordionValue === "saved-cards" ? "new-card" : stripeCards.length > 0 ? "saved-cards" : "new-card"
                );
              } else {
                setAccordionValue(value);
              }
            }}
            className="w-full"
          >
            <AccordionItem value="new-card">
              <AccordionTrigger>
                {t("add")} {t("new")} {t("card")}
              </AccordionTrigger>
              <AccordionContent>
                <StripeCardForm showSaveOptions={showSaveOptions} />
              </AccordionContent>
            </AccordionItem>
            {stripeCards.length > 0 && (
              <AccordionItem value="saved-cards">
                <AccordionTrigger>
                  {t("saved")} {t("cards")} ({stripeCards.length})
                </AccordionTrigger>
                <AccordionContent>
                  <StripeCardsList
                    cards={stripeCards}
                    selectedCardId={selectedPaymentMethodId}
                    onSelectCard={setSelectedPaymentMethodId}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </FormProvider>
    </AppDialog>
  );
}

export interface StripePaymentModalProps extends PaymentModalProps {
  stripeCards: StripePaymentCard[];
}

export function StripePaymentModal({
  open,
  onOpenChange,
  stripeCards,
  onPay,
  isLoading = false,
  amount,
  error,
  showSaveOptions = true,
}: StripePaymentModalProps) {
  const formMethods = useForm<StripeCardFormData>({
    defaultValues: { saveAsDefault: false, saveForFutureUse: false },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) formMethods.reset({ saveAsDefault: false, saveForFutureUse: false });
  }, [open, formMethods]);

  const { stripePromise, isLoading: isLoadingConnect } = useStripeConnect();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoadingConnect ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stripePromise ? (
          <Elements stripe={stripePromise} options={{ appearance: { theme: "stripe" } }}>
            <StripePaymentModalContent
              stripeCards={stripeCards}
              onPay={onPay}
              isLoading={isLoading}
              amount={amount}
              onOpenChange={onOpenChange}
              formMethods={formMethods}
              error={error}
              showSaveOptions={showSaveOptions}
            />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import {
  useForm,
  Controller,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { CreditCard, Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import { AppDialog } from "../layout-ui/app-dialog";
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { toast } from "sonner";
import { AppCard } from "../layout-ui/app-card";

// Cards List Component (internal)
interface StripeCardsListProps {
  cards: StripePaymentCard[];
  selectedCardId?: string;
  onSelectCard: (cardId: string) => void;
  className?: string;
}

function StripeCardsList({
  cards,
  selectedCardId,
  onSelectCard,
  className,
}: StripeCardsListProps) {
  const { t } = useI18n();

  const formatCardNumber = (last4: string) => {
    return `**** **** **** ${last4}`;
  };

  const formatExpiry = (month: number, year: number) => {
    const formattedMonth = month.toString().padStart(2, "0");
    const formattedYear = year.toString().slice(-2);
    return `${formattedMonth}/${formattedYear}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
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
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {formatCardNumber(card.last4)}
                    </p>
                    {card.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        {t("default")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="capitalize">{card.brand}</span>
                    <span>•</span>
                    <span>
                      {formatExpiry(card.expiryMonth, card.expiryYear)}
                    </span>
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
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
}

// Card Form Component (internal)
interface StripeCardFormProps {
  showSaveOptions?: boolean;
  className?: string;
}

// Stripe Card Form Component (internal)
function StripeCardForm({
  showSaveOptions = true,
  className,
}: StripeCardFormProps) {
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
      <div className="space-y-4">
        {/* Stripe Card Element - Collects card details securely */}
        <div className="space-y-2">
          <div className="p-4 border rounded-md">
            <CardElement />
          </div>
        </div>

        {/* Save Options */}
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
                      field.onChange(checked);
                      if (!checked) {
                        // Uncheck saveAsDefault if saveForFutureUse is unchecked
                        setValue("saveAsDefault", false);
                      }
                    }}
                  />
                )}
              />
              <Label
                htmlFor="saveForFutureUse"
                className="text-sm font-normal cursor-pointer"
                onClick={() => {
                  const currentValue = watch("saveForFutureUse");
                  setValue("saveForFutureUse", !currentValue);
                  if (!currentValue) {
                    setValue("saveAsDefault", false);
                  }
                }}
              >
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
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                    }}
                  />
                )}
              />
              <Label
                htmlFor="saveAsDefault"
                className={cn(
                  "text-sm font-normal",
                  !saveForFutureUse &&
                    "text-muted-foreground cursor-not-allowed",
                  saveForFutureUse && "cursor-pointer"
                )}
                onClick={() => {
                  if (saveForFutureUse) {
                    const currentValue = watch("saveAsDefault");
                    setValue("saveAsDefault", !currentValue);
                  }
                }}
              >
                {t("save")} {t("as")} {t("default")}
              </Label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inner component that uses Stripe hooks (must be inside Elements provider)
interface StripePaymentModalContentProps {
  stripeCards: StripePaymentCard[];
  onPay: (
    paymentMethodId?: string,
    cardData?: StripeCardFormData
  ) => void | Promise<void>;
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
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string>(
    stripeCards.length > 0 ? "saved-cards" : "new-card"
  );

  const handleSelectPaymentMethod = (paymentMethodId: string) => {
    setSelectedPaymentMethodId(paymentMethodId);
  };

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
        // CORRECT STRIPE FLOW: Create PaymentMethod from card details
        // Step 1: Get CardElement and create PaymentMethod
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error("Card form not found");
          setIsSubmitting(false);
          return;
        }

        // Step 2: Create PaymentMethod from card details (never send card details to backend)
        const { error: pmError, paymentMethod } =
          await stripe.createPaymentMethod({
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

        await onPay(paymentMethod.id, {
          saveAsDefault,
          saveForFutureUse,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(errorMessage);
      console.error("Payment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPay = selectedPaymentMethodId || accordionValue === "new-card";

  return (
    <AppDialog
      title={
        <DialogTitle className="flex items-center justify-between mt-2">
          <span>{t("payment")}</span>
          {amount && (
            <span className="text-lg font-semibold text-primary">
              {formatCurrency(amount, undefined, undefined, 2, 2, settings)}
            </span>
          )}
        </DialogTitle>
      }
    >
      <FormProvider {...formMethods}>
        <form onSubmit={handleFormSubmit}>
          <Accordion
            type="single"
            value={accordionValue}
            onValueChange={(value) => {
              setSelectedPaymentMethodId(undefined);
              // If closing one, open the other
              if (value === undefined) {
                // One was closed, open the other
                if (accordionValue === "saved-cards") {
                  setAccordionValue("new-card");
                } else {
                  setAccordionValue(
                    stripeCards.length > 0 ? "saved-cards" : "new-card"
                  );
                }
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
                    onSelectCard={handleSelectPaymentMethod}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {error && <div className="text-sm text-red-500 mt-2">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isLoading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!canPay || isLoading || isSubmitting}
              className="min-w-[120px]"
            >
              {isLoading || isSubmitting ? t("processing") + "..." : t("pay")}{" "}
              {amount &&
                formatCurrency(amount, undefined, undefined, 2, 2, settings)}
            </Button>
          </div>
        </form>
      </FormProvider>
    </AppDialog>
  );
}

interface StripePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stripeCards: StripePaymentCard[];
  onPay: (
    paymentMethodId: string,
    cardData?: StripeCardFormData
  ) => void | Promise<void>;
  isLoading?: boolean;
  amount?: number;
  error?: string;
  showSaveOptions?: boolean;
}

// Main Payment Modal Component
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
  // Form for new card data (for watching save options)
  const formMethods = useForm<StripeCardFormData>({
    defaultValues: {
      saveAsDefault: false,
      saveForFutureUse: false,
    },
    mode: "onChange",
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      formMethods.reset({
        saveAsDefault: false,
        saveForFutureUse: false,
      });
    }
  }, [open, formMethods]);

  const stripePromise = getStripe();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <Elements
          stripe={stripePromise}
          options={{
            appearance: {
              theme: "stripe",
            },
          }}
        >
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
      </DialogContent>
    </Dialog>
  );
}

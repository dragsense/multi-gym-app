// React
import { useState, useEffect } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";

// Stripe
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";

// Components
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useStripeConnect } from "@/hooks/use-stripe-connect";

interface AddCardFormData {
  setAsDefault: boolean;
}

interface AddCardModalContentProps {
  onAddCard: (paymentMethodId: string, setAsDefault: boolean) => void;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddCardModalContent({
  onAddCard,
  isLoading,
  onOpenChange,
}: AddCardModalContentProps) {
  const { t } = useI18n();
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<AddCardFormData>({
    defaultValues: {
      setAsDefault: false,
    },
  });

  const { control, watch } = formMethods;
  const setAsDefault = watch("setAsDefault");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isLoading) return;

    if (!stripe || !elements) {
      toast.error("Payment system not ready");
      return;
    }

    setIsSubmitting(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        toast.error("Card form not found");
        setIsSubmitting(false);
        return;
      }

      // Create PaymentMethod from card details
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (pmError || !paymentMethod) {
        toast.error(pmError?.message || "Failed to create payment method");
        setIsSubmitting(false);
        return;
      }

      // Call the callback to save the card
      onAddCard(paymentMethod.id, setAsDefault);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add card";
      toast.error(errorMessage);
      console.error("Add card error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppDialog
      title={
        <DialogTitle className="flex items-center gap-2 mt-2">
          <CreditCard className="h-5 w-5" />
          <span>Add New Card</span>
        </DialogTitle>
      }
    >
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Stripe Card Element */}
            <div className="space-y-2">
              <Label>Card Details</Label>
              <div className="p-4 border rounded-md">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#424770",
                        "::placeholder": {
                          color: "#aab7c4",
                        },
                      },
                      invalid: {
                        color: "#9e2146",
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Set as Default Option */}
            <div className="flex items-center space-x-2 pt-2">
              <Controller
                name="setAsDefault"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="setAsDefault"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="setAsDefault"
                className="text-sm font-normal cursor-pointer"
              >
                Set as default payment method
              </Label>
            </div>
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
              disabled={isLoading || isSubmitting}
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
      </FormProvider>
    </AppDialog>
  );
}

interface AddCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (paymentMethodId: string, setAsDefault: boolean) => void;
  isLoading?: boolean;
}

export function AddCardModal({
  open,
  onOpenChange,
  onAddCard,
  isLoading = false,
}: AddCardModalProps) {
  const { t } = useI18n();

  // Fetch connected account and get proper Stripe instance
  const {
    stripePromise,
    isLoading: isLoadingConnect,
    stripeAccountId,
  } = useStripeConnect();

  const handleAddCard = (paymentMethodId: string, setAsDefault: boolean) => {
    onAddCard(paymentMethodId, setAsDefault);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {isLoadingConnect ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              appearance: {
                theme: "stripe",
              },
            }}
          >
            <AddCardModalContent
              onAddCard={handleAddCard}
              isLoading={isLoading}
              onOpenChange={onOpenChange}
            />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

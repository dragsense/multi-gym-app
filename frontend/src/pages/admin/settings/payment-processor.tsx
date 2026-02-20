import { useId, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { usePaymentProcessors } from "@/hooks/use-payment-processors";
import { getMyBusiness, updateMyBusiness } from "@/services/business/business.api";
import { PageInnerLayout } from "@/layouts";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EPaymentProcessorType } from "@shared/enums";
import { toast } from "sonner";

export default function PaymentProcessorSettingsPage() {
  const componentId = useId();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["business", "me"],
    queryFn: getMyBusiness,
  });

  const { processors, isLoading: processorsLoading } = usePaymentProcessors();

  const updateMutation = useMutation({
    mutationFn: (paymentProcessorId: string | null) =>
      updateMyBusiness({ paymentProcessorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", "me"] });
      toast.success("Payment processor updated successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update payment processor.");
    },
  });

  const currentId = selectedId ?? business?.paymentProcessorId ?? null;
  const hasChanges =
    (currentId ?? "") !== (business?.paymentProcessorId ?? "");
  const isDisabled =
    businessLoading || processorsLoading || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || currentId === undefined) return;
    updateMutation.mutate(currentId);
  };

  const icons: Partial<Record<EPaymentProcessorType, React.ReactNode>> = {
    [EPaymentProcessorType.STRIPE]: <CreditCard className="h-5 w-5" />,
    [EPaymentProcessorType.PAYSAFE]: <Wallet className="h-5 w-5" />,
  };

  return (
    <PageInnerLayout Header={null}>
      <div data-component-id={componentId} className="max-w-2xl">
        {businessLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading…</span>
          </div>
        ) : !business ? (
          <AppCard>
            <p className="text-muted-foreground">
              You don’t have a business. Payment processor can be set during
              business onboarding.
            </p>
          </AppCard>
        ) : (
          <AppCard
            footer={
              <div className="flex justify-end">
                <Button
                  type="submit"
                  form="payment-processor-form"
                  disabled={!hasChanges || isDisabled}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            }
          >
            <p className="text-sm text-muted-foreground mb-4">
              Your business uses the selected payment processor for all
              payments. You can change it here at any time.
            </p>
            <form
              id="payment-processor-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {processorsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading payment processors…
                </p>
              ) : !processors.length ? (
                <p className="text-sm text-muted-foreground">
                  No payment processors available.
                </p>
              ) : (
                <RadioGroup
                  value={currentId ?? ""}
                  onValueChange={(id) => setSelectedId(id || null)}
                  disabled={isDisabled}
                  className="grid gap-3"
                >
                  {processors.map((processor) => (
                    <Label
                      key={processor.id}
                      htmlFor={`processor-${processor.id}`}
                      className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-muted/50"
                    >
                      <RadioGroupItem
                        value={processor.id}
                        id={`processor-${processor.id}`}
                      />
                      <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
                        {icons[processor.type as EPaymentProcessorType] ?? (
                          <CreditCard className="h-5 w-5" />
                        )}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{processor.type}</p>
                        {processor.description && (
                          <p className="text-sm text-muted-foreground">
                            {processor.description}
                          </p>
                        )}
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </form>
          </AppCard>
        )}
      </div>
    </PageInnerLayout>
  );
}

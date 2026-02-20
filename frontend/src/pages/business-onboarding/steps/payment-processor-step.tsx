// React
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Types
import type { IPaymentProcessor } from "@shared/interfaces/payment-processors.interface";
import { EPaymentProcessorType } from "@shared/enums";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { StepNavigationButtons } from "@/components/business-onboarding";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet } from "lucide-react";

// Services
import { fetchPaymentProcessors } from "@/services/payment-processors.api";

interface IPaymentProcessorStepProps {
  onComplete: (data: [paymentProcessorId: string, processorType: EPaymentProcessorType]) => void;
  onBack?: () => void;
  businessData: { businessId: string; name: string; subdomain: string } | null;
  selectedPaymentProcessorId?: string | null;
}

const PROCESSOR_ICONS: Partial<Record<EPaymentProcessorType, React.ReactNode>> = {
  [EPaymentProcessorType.STRIPE]: <CreditCard className="h-5 w-5" />,
  [EPaymentProcessorType.PAYSAFE]: <Wallet className="h-5 w-5" />,
};

export function PaymentProcessorStep({
  onComplete,
  onBack,
  businessData,
  selectedPaymentProcessorId,
}: IPaymentProcessorStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(selectedPaymentProcessorId ?? null);

  const { data: processorsData, isLoading } = useQuery({
    queryKey: ["payment-processors", "enabled"],
    queryFn: () => fetchPaymentProcessors({ limit: 50, page: 1 }),
  });

  const processors: IPaymentProcessor[] = (processorsData?.data ?? []).filter(
    (p) => p.enabled && (p.type === EPaymentProcessorType.STRIPE || p.type === EPaymentProcessorType.PAYSAFE)
  );

  useEffect(() => {
    if (selectedPaymentProcessorId) {
      setSelectedId(selectedPaymentProcessorId);
    }
  }, [selectedPaymentProcessorId]);

  const handleContinue = () => {
    const processor = processors.find((p) => p.id === selectedId);
    if (selectedId && processor) {
      onComplete([selectedId, processor.type]);
    }
  };

  if (isLoading) {
    return (
      <AppCard loading={true}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading payment processors...</p>
        </div>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      <AppCard
        footer={
          <StepNavigationButtons
            onBack={onBack}
            onContinue={handleContinue}
            continueDisabled={!selectedId}
            showBack={!!onBack}
          />
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose the payment processor your business will use to accept payments.
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> The payment processor you select here will be used by your business for all payments. You can change this later in business settings if needed.
            </p>
          </div>

          {processors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment processors available. Please contact support.
            </div>
          ) : (
            <RadioGroup
              value={selectedId ?? ""}
              onValueChange={setSelectedId}
              className="grid gap-3"
            >
              {processors.map((processor) => (
                <Label
                  key={processor.id}
                  htmlFor={processor.id}
                  className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-muted/50"
                >
                  <RadioGroupItem value={processor.id} id={processor.id} />
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
                    {PROCESSOR_ICONS[processor.type as EPaymentProcessorType] ?? (
                      <CreditCard className="h-5 w-5" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium capitalize">{processor.type}</p>
                    {processor.description && (
                      <p className="text-sm text-muted-foreground">{processor.description}</p>
                    )}
                  </div>
                </Label>
              ))}
            </RadioGroup>
          )}
        </div>
      </AppCard>
    </div>
  );
}

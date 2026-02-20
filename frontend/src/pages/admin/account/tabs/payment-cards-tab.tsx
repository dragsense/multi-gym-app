// Hooks
import { usePaymentCardsManager } from "@/hooks/use-payment-cards";
import { EPaymentProcessorType } from "@shared/enums";
import { useCurrentBusinessPaymentProcessor } from "@/payment-processors";

// Components
import { PaymentCardsManager } from "@/components/shared-ui/payment-cards-manager";

export default function PaymentCardsTab() {
  const { processorType } = useCurrentBusinessPaymentProcessor();
  const resolvedType = processorType ?? EPaymentProcessorType.STRIPE;

  const {
    cards,
    defaultPaymentMethodId,
    isLoading,
    setDefaultCard,
    isSettingDefault,
    deleteCard,
    isDeletingCard,
    addCard,
    isAddingCard,
  } = usePaymentCardsManager();

  return (
    <PaymentCardsManager
      cards={cards}
      defaultPaymentMethodId={defaultPaymentMethodId}
      processorType={resolvedType}
      isLoading={isLoading}
      onSetDefault={setDefaultCard}
      onDelete={deleteCard}
      onAddCard={addCard}
      isSettingDefault={isSettingDefault}
      isDeletingCard={isDeletingCard}
      isAddingCard={isAddingCard}
      title="Payment Methods"
      emptyMessage="No payment methods saved"
    />
  );
}

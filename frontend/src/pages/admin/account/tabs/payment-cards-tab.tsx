// Hooks
import { usePaymentCardsManager } from "@/hooks/use-payment-cards";

// Components
import { PaymentCardsManager } from "@/components/shared-ui/payment-cards-manager";

export default function PaymentCardsTab() {
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

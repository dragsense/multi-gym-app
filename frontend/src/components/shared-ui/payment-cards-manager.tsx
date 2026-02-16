// React
import { useId, useState } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { ConfirmDialog } from "@/components/layout-ui/app-alert-dialog";
import { AddCardModal } from "@/components/shared-ui/add-card-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2, Star, Loader2, Plus } from "lucide-react";

// Types
import type { IStripeCard } from "@/@types/payment.types";

interface IPaymentCardsManagerProps {
  cards: IStripeCard[];
  defaultPaymentMethodId: string | null;
  isLoading?: boolean;
  onSetDefault: (paymentMethodId: string) => void;
  onDelete: (paymentMethodId: string) => void;
  onAddCard: (data: { paymentMethodId: string; setAsDefault?: boolean }) => void;
  isSettingDefault?: boolean;
  isDeletingCard?: boolean;
  isAddingCard?: boolean;
  title?: string;
  emptyMessage?: string;
}

// Card brand icons mapping
const getCardBrandIcon = (brand: string): string => {
  const brandIcons: Record<string, string> = {
    visa: "💳",
    mastercard: "💳",
    amex: "💳",
    discover: "💳",
    diners: "💳",
    jcb: "💳",
    unionpay: "💳",
  };
  return brandIcons[brand.toLowerCase()] || "💳";
};

// Format card brand name
const formatBrandName = (brand: string): string => {
  const brandNames: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return brandNames[brand.toLowerCase()] || brand;
};

export function PaymentCardsManager({
  cards,
  defaultPaymentMethodId,
  isLoading = false,
  onSetDefault,
  onDelete,
  onAddCard,
  isSettingDefault = false,
  isDeletingCard = false,
  isAddingCard = false,
  title = "Payment Methods",
  emptyMessage = "No payment methods saved",
}: IPaymentCardsManagerProps) {
  const componentId = useId();
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [actionCardId, setActionCardId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSetDefault = (paymentMethodId: string) => {
    setActionCardId(paymentMethodId);
    onSetDefault(paymentMethodId);
  };

  const handleDeleteConfirm = () => {
    if (cardToDelete) {
      setActionCardId(cardToDelete);
      onDelete(cardToDelete);
      setCardToDelete(null);
    }
  };

  const handleAddCard = (paymentMethodId: string, setAsDefault: boolean) => {
    onAddCard({ paymentMethodId, setAsDefault });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <AppCard
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              disabled={isAddingCard}
            >
              {isAddingCard ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Add Card
            </Button>
          </div>
        }
        data-component-id={componentId}
      >
        {cards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => {
              const isDefault = card.id === defaultPaymentMethodId;
              const isActionPending = actionCardId === card.id && (isSettingDefault || isDeletingCard);

              return (
                <div
                  key={card.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDefault ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Card Icon */}
                    <div className="text-2xl">{getCardBrandIcon(card.card?.brand || "")}</div>

                    {/* Card Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatBrandName(card.card?.brand || "Card")}
                        </span>
                        <span className="text-muted-foreground">
                          •••• {card.card?.last4}
                        </span>
                        {isDefault && (
                          <Badge variant="default" className="ml-2">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Expires {card.card?.exp_month}/{card.card?.exp_year}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(card.id)}
                        disabled={isActionPending}
                      >
                        {isActionPending && isSettingDefault ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Set Default
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setCardToDelete(card.id)}
                      disabled={isDefault || isActionPending}
                      title={isDefault ? "Cannot delete default card" : "Delete card"}
                    >
                      {isActionPending && isDeletingCard ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppCard>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!cardToDelete}
        onOpenChange={() => setCardToDelete(null)}
        title="Delete Payment Method"
        description="Are you sure you want to delete this payment method? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />

      {/* Add Card Modal */}
      <AddCardModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddCard={handleAddCard}
        isLoading={isAddingCard}
      />
    </>
  );
}

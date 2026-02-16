import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageInnerLayout } from "@/layouts";
import { CartList } from "@/components/admin/cart";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { SEGMENTS, ADMIN_ROUTES } from "@/config/routes.config";
import { updateCartItem, removeFromCart } from "@/services/cart.api";

function CartHeader() {
  const { user } = useAuthUser();
  const segment = SEGMENTS[user?.level ?? -1] ?? "/admin";
  return (
    <Button variant="outline" size="sm" asChild>
      <Link to={`${segment}/${ADMIN_ROUTES.STORE}`}>
        <ShoppingCart className="h-4 w-4 mr-1" />
        Store
      </Link>
    </Button>
  );
}

export default function CartPage() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({
      productId,
      productVariantId,
      quantity,
    }: {
      productId: string;
      productVariantId?: string;
      quantity: number;
    }) => updateCartItem(productId, quantity, productVariantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeMutation = useMutation({
    mutationFn: ({
      productId,
      productVariantId,
    }: {
      productId: string;
      productVariantId?: string;
    }) => removeFromCart(productId, productVariantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const onUpdateQuantity = useCallback(
    (productId: string, productVariantId: string | undefined, quantity: number) => {
      updateMutation.mutate({ productId, productVariantId, quantity });
    },
    [updateMutation]
  );

  const onRemove = useCallback(
    (productId: string, productVariantId?: string) => {
      removeMutation.mutate({ productId, productVariantId });
    },
    [removeMutation]
  );

  return (
    <PageInnerLayout Header={<CartHeader />}>
      <CartList onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} />
    </PageInnerLayout>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";
import { StoreProductDetailContent } from "@/components/admin/store";
import { addToCart } from "@/services/cart.api";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { RelatedProducts } from "@/page-components/store";

type TStoreProductDetailExtraProps = Record<string, unknown>;

interface IStoreProductDetailProps
  extends THandlerComponentProps<
    TSingleHandlerStore<IProduct, TStoreProductDetailExtraProps>
  > {}

export default function StoreProductDetail({ store }: IStoreProductDetailProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  if (!store) return null;

  const { response: product, isLoading } = store(
    useShallow((s) => ({
      response: s.response as IProduct | null,
      isLoading: s.isLoading,
    }))
  );

  const addToCartMutation = useMutation({
    mutationFn: (data: { variantId?: string; quantity: number }) => {
      if (!product?.id) {
        throw new Error("Product not loaded");
      }
      return addToCart({
        productId: product.id,
        productVariantId: data.variantId,
        quantity: data.quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(t("addedToCart") || "Added to cart");
    },
    onError: (err: Error) => {
      toast.error(err?.message || buildSentence(t, "failed", "to", "add"));
    },
  });

  const handleAddToCart = (variantId?: string, quantity: number = 1) => {
    if (!product?.id) return;
    addToCartMutation.mutate({ variantId, quantity });
  };

  return (
    <div className="p-4 space-y-8">
      <StoreProductDetailContent
        product={product as IProduct}
        isLoading={isLoading || addToCartMutation.isPending}
        onAddToCart={handleAddToCart}
      />

      <RelatedProducts product={product as IProduct} />
    </div>
  );
}


import { useId, useTransition, useCallback, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShoppingCart } from "lucide-react";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TSingleHandlerStore } from "@/stores";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { toast } from "sonner";
import { fetchStoreProduct } from "@/services/store.api";
import { addToCart } from "@/services/cart.api";

export type TAddToCartExtraProps = Record<string, unknown>;

type IAddToCartProps = THandlerComponentProps<
  TSingleHandlerStore<IProduct, TAddToCartExtraProps>
>;

export default function AddToCart({ storeKey, store }: IAddToCartProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState<string | undefined>();

  const selector = useShallow((state: any) => ({
    action: state.action,
    payload: state.payload,
    response: state.response,
    setAction: state.setAction,
  }));

  const storeState = store ? store(selector) : null;
  const productId = storeState?.payload as string | null | undefined;
  const open = storeState?.action === "addToCart" && !!productId;

  const { data: product } = useQuery({
    queryKey: ["store-product", productId],
    queryFn: () => fetchStoreProduct(productId!),
    enabled: open && !!productId,
  });

  const addToCartMutation = useMutation({
    mutationFn: () =>
      addToCart({
        productId: productId!,
        productVariantId: variantId,
        quantity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(t("addedToCart") || "Added to cart");
      handleClose();
    },
    onError: (err: Error) => {
      toast.error(err?.message || buildSentence(t, "failed", "to", "add"));
    },
  });

  const handleClose = useCallback(() => {
    if (!storeState?.setAction) return;
    startTransition(() => {
      storeState.setAction("none");
      setQuantity(1);
      setVariantId(undefined);
    });
  }, [storeState?.setAction, startTransition]);

  const handleConfirm = () => {
    addToCartMutation.mutate();
  };

  if (!store || !storeState) return null;
  const p = product as IProduct | undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose} data-component-id={componentId}>
      <DialogContent className="sm:max-w-md">
        <AppDialog
          title={t("addToCart")}
          description={p ? p.name : ""}
          footerContent={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={addToCartMutation.isPending}>
                {t("cancel")}
              </Button>
              <Button onClick={handleConfirm} disabled={addToCartMutation.isPending || !p}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {addToCartMutation.isPending ? t("adding") : t("addToCart")}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {p && (
              <AppCard>
                <div className="space-y-4">
                  {p.variants && p.variants.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t("variant")}</Label>
                      <select
                        className="w-full border rounded px-3 py-2 bg-background"
                        value={variantId ?? ""}
                        onChange={(e) => setVariantId(e.target.value || undefined)}
                      >
                        <option value="">{t("default")}</option>
                        {(p.variants as any[]).map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.sku} - ${Number(v.price ?? 0).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>{t("quantity")}</Label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </AppCard>
            )}
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

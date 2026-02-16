import { useShallow } from "zustand/shallow";
import { useId, useTransition } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, FileText, ShoppingCart } from "lucide-react";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TStoreProductViewExtraProps = Record<string, unknown>;

interface IStoreProductViewProps
  extends THandlerComponentProps<TSingleHandlerStore<IProduct, TStoreProductViewExtraProps>> {}

export default function StoreProductView({ storeKey, store }: IStoreProductViewProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }

  const { response: product, action, reset, setAction } = store(
    useShallow((s) => ({
      response: s.response,
      action: s.action,
      reset: s.reset,
      setAction: s.setAction,
    }))
  );

  if (!product) return null;

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onAddToCart = () => {
    startTransition(() => setAction("addToCart", product.id));
  };

  const thumb = product.defaultImages?.[0];
  const thumbUrl = typeof thumb === "object" && thumb?.url ? thumb.url : null;

  return (
    <Dialog open={action === "view"} onOpenChange={handleCloseView} data-component-id={componentId}>
      <DialogContent className="min-w-5xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={t("productDetails")}
          description={t("viewDetailedInformationAboutThisProduct")}
          footerContent={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseView}>
                {t("close")}
              </Button>
              <Button onClick={onAddToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t("addToCart")}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <AppCard
              header={
                <h2 className="text-2xl font-semibold truncate">{product.name}</h2>
              }
            >
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold text-foreground">
                    ${Number(product.defaultPrice ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  <span>{t("qty")}: {product.totalQuantity ?? 0}</span>
                </div>
              </div>
            </AppCard>
            {thumbUrl && (
              <AppCard>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={thumbUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </AppCard>
            )}
            {product.description && (
              <AppCard
                header={
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {t("description")}
                  </h3>
                }
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm">{product.description}</div>
                </div>
              </AppCard>
            )}
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

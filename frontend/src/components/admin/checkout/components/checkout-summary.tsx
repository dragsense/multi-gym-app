import { useId } from "react";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { Link } from "react-router-dom";
import { SEGMENTS, ADMIN_ROUTES } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useCartAll } from "@/hooks/use-cart";

export interface ICheckoutSummaryProps {}

export function CheckoutSummary({}: ICheckoutSummaryProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const segment = SEGMENTS[user?.level ?? -1] ?? "/admin";

  const { items, isLoading } = useCartAll();

  if (isLoading) {
    return (
      <div className="" data-component-id={componentId}>
        <AppCard loading >null</AppCard>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <AppCard>
        <div className="p-8 text-center text-muted-foreground">
          <p>{t("cartEmpty") || "Your cart is empty."}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to={`${segment}/${ADMIN_ROUTES.STORE}`}>
              {t("browseProducts") || "Browse products"}
            </Link>
          </Button>
        </div>
      </AppCard>
    );
  }

  const total = items.reduce(
    (sum, i) => sum + (i.quantity ?? 0) * Number(i.unitPrice ?? 0),
    0
  );

  return (
    <div className="space-y-6" data-component-id={componentId}>
      <AppCard
        header={<h2 className="font-semibold">{t("orderSummary") || "Order summary"}</h2>}
      >
        <ul className="space-y-4">
          {items.map((item, idx) => (
            <li
              key={`${item.productId}-${item.productVariantId ?? "d"}-${idx}`}
              className="flex justify-between items-start text-sm"
            >
              <div className="flex gap-3">
                {item.imageUrl && (
                  <div className="w-10 h-10 bg-muted rounded overflow-hidden shrink-0 border">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  </div>
                )}
                <div>
                  <span className="font-medium block">{item.description}</span>
                  <span className="text-muted-foreground text-xs">Qty: {item.quantity}</span>
                </div>
              </div>
              <span className="font-medium">
                $
                {((item.quantity ?? 0) * Number(item.unitPrice ?? 0)).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
          <span>{t("total")}</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </AppCard>

      <div className="text-center">
        <Button variant="link" size="sm" asChild className="text-muted-foreground">
          <Link to={`${segment}/${ADMIN_ROUTES.CART}`}>
            <ArrowLeft className="h-3 w-3 mr-1" />
            {t("backToCart") || "Back to cart"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

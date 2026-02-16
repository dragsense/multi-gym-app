import { useId } from "react";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { Trash2, ShoppingCart, ArrowLeft, ArrowRight, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import type { ICartLineItem } from "@shared/interfaces";
import { useI18n } from "@/hooks/use-i18n";
import { Link } from "react-router-dom";
import { SEGMENTS, ADMIN_ROUTES } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useCart } from "@/hooks/use-cart";

export interface ICartListProps {
  onUpdateQuantity: (productId: string, productVariantId: string | undefined, quantity: number) => void;
  onRemove: (productId: string, productVariantId?: string) => void;
}

const PAGINATION_LIMIT = 10;

function CartLineCard({
  item,
  onUpdateQuantity,
  onRemove,
  t,
}: {
  item: ICartLineItem;
  onUpdateQuantity: (productId: string, productVariantId: string | undefined, quantity: number) => void;
  onRemove: (productId: string, productVariantId?: string) => void;
  t: (key: string) => string;
}) {
  return (
    <AppCard>
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0 border">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.description}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-semibold text-base line-clamp-2">{item.description}</p>
            <p className="text-sm text-muted-foreground">
              ${Number(item.unitPrice).toFixed(2)} × {item.quantity} =
              <span className="font-medium text-foreground ml-1">
                ${((item.quantity ?? 0) * Number(item.unitPrice ?? 0)).toFixed(2)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-md overflow-hidden bg-background">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const q = Math.max(0, (item.quantity || 0) - 1);
                  if (q === 0) onRemove(item.productId, item.productVariantId);
                  else onUpdateQuantity(item.productId, item.productVariantId, q);
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-sm font-medium tabular-nums">
                {item.quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none text-muted-foreground hover:text-foreground"
                onClick={() =>
                  onUpdateQuantity(
                    item.productId,
                    item.productVariantId,
                    (item.quantity || 0) + 1
                  )
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(item.productId, item.productVariantId)}
              title={t("remove") || "Remove"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppCard>
  );
}

export default function CartList({ onUpdateQuantity, onRemove }: ICartListProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const segment = SEGMENTS[user?.level ?? -1] ?? "/admin";

  const { cart, items, isLoading, pagination, setPage } = useCart(PAGINATION_LIMIT);

  const itemCount = (cart?.items ?? []).length;
  const grandTotal = (cart?.items ?? []).reduce(
    (sum, i) => sum + (i.quantity ?? 0) * Number(i.unitPrice ?? 0),
    0
  );

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl" data-component-id={componentId}>
        <AppCard loading> </AppCard>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="space-y-4 max-w-2xl" data-component-id={componentId}>
        <AppCard>
          <div className="py-8 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("cartEmpty") || "Your cart is empty."}</p>
            <Button variant="default" className="mt-4" asChild>
              <Link to={`${segment}/${ADMIN_ROUTES.STORE}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("backtostore")}
              </Link>
            </Button>
          </div>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl" data-component-id={componentId}>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <CartLineCard
            key={`${item.productId}-${item.productVariantId ?? "d"}-${idx}`}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            t={t}
          />
        ))}
      </div>

      {pagination.total > PAGINATION_LIMIT && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AppCard>
        <div className="p-4 flex justify-between items-center">
          <span className="font-semibold">{t("total")}</span>
          <span className="text-lg font-semibold">${grandTotal.toFixed(2)}</span>
        </div>
      </AppCard>

      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" asChild>
          <Link to={`${segment}/${ADMIN_ROUTES.STORE}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("continueShopping") || "Continue shopping"}
          </Link>
        </Button>
        <Button asChild size="lg" className="px-8">
          <Link to={`${segment}/${ADMIN_ROUTES.CHECKOUT}`}>
            {t("checkout") || "Checkout"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

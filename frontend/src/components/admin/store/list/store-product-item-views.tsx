import { Eye, ShoppingCart, Image as ImageIcon, Package, DollarSign } from "lucide-react";
import { useTransition } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import { useI18n } from "@/hooks/use-i18n";
import { SEGMENTS, ADMIN_ROUTES } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { StoreProductCard } from "./store-product-card";

interface IStoreProductItemViewArgs {
  handleView: (id: string) => void;
  handleAddToCart: (id: string) => void;
  componentId?: string;
}

export function storeProductItemViews({
  handleView,
  handleAddToCart,
  componentId = "store-product-item-views",
}: IStoreProductItemViewArgs) {
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const segment = SEGMENTS[user?.level ?? -1] ?? "/admin";

  const listItem = (item: IProduct) => {
    return (
      <StoreProductCard
        product={item}
        onView={handleView}
        componentId={componentId}
      />
    );
  };

  return { listItem };
}

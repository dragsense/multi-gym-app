import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { SEGMENTS, ADMIN_ROUTES } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";

interface ICartIndicatorProps {
  itemCount: number;
}

export function CartIndicator({ itemCount }: ICartIndicatorProps) {
  const { t } = useI18n();
  const { user } = useAuthUser();
  const segment = SEGMENTS[user?.level ?? -1] ?? "/admin";

  return (
    <Button variant="outline" size="sm" asChild className="relative">
      <Link to={`${segment}/${ADMIN_ROUTES.CART}`}>
        <ShoppingCart className="h-4 w-4 mr-2" />
        {t("cart")}
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </Link>
    </Button>
  );
}

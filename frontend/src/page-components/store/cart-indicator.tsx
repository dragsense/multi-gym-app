import { useQuery } from "@tanstack/react-query";
import { getCart } from "@/services/cart.api";
import { CartIndicator as CartIndicatorUi } from "@/components/admin/store";

export default function CartIndicator() {
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const itemCount =
    cart?.items?.reduce((acc, item) => acc + (item.quantity ?? 0), 0) ?? 0;

  return <CartIndicatorUi itemCount={itemCount} />;
}


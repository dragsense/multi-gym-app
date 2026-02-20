import { useParams } from "react-router-dom";
import type { IOrder } from "@shared/interfaces/order.interface";
import { PageInnerLayout } from "@/layouts";
import { SingleHandler } from "@/handlers";
import { OrderDetailContent } from "@/components/admin/orders";
import { fetchOrder } from "@/services/order.api";
import { OrderStatusUpdate } from "@/page-components";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

type TOrderDetailExtraProps = {
  canUpdateStatus?: boolean;
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthUser();
  
  const canUpdateStatus =
    (user?.level ?? -1) === (EUserLevels.ADMIN as number) ||
    (user?.level ?? -1) === (EUserLevels.PLATFORM_OWNER as number);

  if (!id) return null;

  const ORDER_DETAIL_STORE_KEY = `order-detail-${id}`;

  return (
    <PageInnerLayout Header={null}>
      <SingleHandler<IOrder, TOrderDetailExtraProps>
        queryFn={(_, params) => fetchOrder(id, params as any)}
        storeKey={ORDER_DETAIL_STORE_KEY}
        initialParams={{
          _relations: "lineItems.product.defaultImages,buyerUser,billing,history,history.changedBy",
          _select: "buyerUser.id,buyerUser.email, buyerUser.firstName, buyerUser.lastName",
        }}
        enabled={!!id}
        SingleComponent={OrderDetailContent}
        singleProps={{ canUpdateStatus }}
        actionComponents={[
          {
            action: "updateStatus",
            comp: OrderStatusUpdate,
          },
        ]}
      />
    
    </PageInnerLayout>
  );
}

import type { IOrder } from "@shared/interfaces/order.interface";
import { ListHandler, SingleHandler } from "@/handlers";
import { OrderList, OrderView } from "@/components/admin/orders";
import { fetchOrders, fetchOrder } from "@/services/order.api";
import { PageInnerLayout } from "@/layouts";
import { OrderListDto } from "@shared/dtos";
import type { IOrderListExtraProps } from "@/components/admin/orders";

import { useAuthUser } from "@/hooks/use-auth-user";

const ORDERS_STORE_KEY = "order";

export default function OrdersPage() {
  const { user } = useAuthUser();

  return (
    <PageInnerLayout
      Header={null}
    >
      <SingleHandler<IOrder, Record<string, unknown>>
        queryFn={fetchOrder}
        storeKey={ORDERS_STORE_KEY}
        initialParams={{
          _relations: "lineItems.product.defaultImages,buyerUser",
          _select: "buyerUser.id,buyerUser.email, buyerUser.firstName, buyerUser.lastName",
        }}
        SingleComponent={OrderView}
      />
      <ListHandler<IOrder, OrderListDto, IOrderListExtraProps, IOrder, unknown>
        queryFn={fetchOrders}
        initialParams={{
          page: 1,
          limit: 20,
          _relations: "lineItems.product.defaultImages,buyerUser",
          _searchable: "orderRef,title,buyerUser.email,buyerUser.firstName,buyerUser.lastName",
          _select: "buyerUser.id,buyerUser.email, buyerUser.firstName, buyerUser.lastName",
        }}
        ListComponent={OrderList}
        dto={OrderListDto}
        storeKey={ORDERS_STORE_KEY}
        listProps={{}}
      />
    </PageInnerLayout>
  );
}

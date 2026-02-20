import { BaseService } from "./base.service.api";
import type { IOrder, ICheckout, ICheckoutResponse } from "@shared/interfaces";
import type { UpdateOrderDto } from "@shared/dtos";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";

const ORDERS_API_PATH = "/orders";

const orderService = new BaseService<
  IOrder,
  ICheckout,
  Pick<UpdateOrderDto, "status">
>(ORDERS_API_PATH);

export const fetchOrders = (params: IListQueryParams) =>
  orderService.get<IOrder>(params);

export const fetchOrder = (id: string, params: IListQueryParams) =>
  orderService.getSingle<IOrder>(id, params);

export const checkout = (data?: ICheckout) =>
  orderService.post<ICheckoutResponse>(data ?? {}, undefined, "/checkout");

export const updateOrderStatus = (
  id: string,
  data: Pick<UpdateOrderDto, "status">
) => orderService.patch<{ message: string }>(null)(data, undefined, `/${id}/status`);

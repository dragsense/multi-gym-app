import { BaseService } from "./base.service.api";
import type { ICart, IAddToCart } from "@shared/interfaces";

const CART_API_PATH = "/cart";

// Base service for cart operations
const cartService = new BaseService<
  ICart,
  IAddToCart | { quantity: number },
  { quantity: number }
>(CART_API_PATH);

export const getCart = () => cartService.getSingle<ICart>();

export const addToCart = (data: IAddToCart) =>
  cartService.put<ICart>(undefined as any)(data, undefined, "/items");

export const updateCartItem = (
  productId: string,
  quantity: number,
  productVariantId?: string
) =>
  cartService.put<ICart>(productId)(
    { quantity },
    productVariantId ? { productVariantId } : undefined,
    "/items"
  );

export const removeFromCart = (
  productId: string,
  productVariantId?: string
) =>
  cartService.delete<ICart>(
    productId,
    productVariantId ? { productVariantId } : undefined,
    "/items"
  );

export const clearCart = () =>
  cartService.delete<{ message: string } | void>(undefined as any);

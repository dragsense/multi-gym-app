// React & Query
import { useQuery } from "@tanstack/react-query";

// Services
import { getCart } from "@/services/cart.api";

// Types
import type { ICart, ICartLineItem } from "@shared/interfaces";

// Hooks
import { useFrontendPagination } from "./use-frontend-pagination";

export interface IUseCartReturn {
  cart: ICart | undefined;
  items: ICartLineItem[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    lastPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

/**
 * Cart with frontend pagination.
 * Fetches cart via getCart, paginates items on the client (like recent sessions).
 */
export function useCart(
  initialLimit: number = 5
): IUseCartReturn {
  const { data: cart, isLoading } = useQuery<ICart>({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const items = cart?.items ?? [];

  const {
    paginatedData,
    pagination,
    setPage,
    setLimit,
  } = useFrontendPagination<ICartLineItem>(items, initialLimit);

  return {
    cart,
    items: paginatedData,
    isLoading,
    pagination,
    setPage,
    setLimit,
  };
}

export interface IUseCartAllReturn {
  cart: ICart | undefined;
  items: ICartLineItem[];
  isLoading: boolean;
}

/**
 * Cart with all items (no pagination).
 * Fetches cart via getCart and returns full items array.
 */
export function useCartAll(): IUseCartAllReturn {
  const { data: cart, isLoading } = useQuery<ICart>({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const items = cart?.items ?? [];

  return {
    cart,
    items,
    isLoading,
  };
}

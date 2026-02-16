import { BaseService } from "./base.service.api";
import { apiRequest } from "@/utils/fetcher";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IPaginatedResponse } from "@shared/interfaces/api/response.interface";
import type { IProduct } from "@shared/interfaces/products/product.interface";

const STORE_PRODUCTS_API_PATH = "/store/products";

// Base service for storefront products
const storeProductService = new BaseService<
  IProduct,
  Record<string, never>,
  Record<string, never>
>(STORE_PRODUCTS_API_PATH);

export const fetchStoreProducts = (
  params: IListQueryParams
) => storeProductService.get(params);

// Match other services: pass IListQueryParams straight through, including _relations
export const fetchStoreProduct = (id: string, params?: IListQueryParams) =>
  storeProductService.getSingle<IProduct>(id, params);

export const fetchRelatedProducts = (productId: string, params: IListQueryParams) =>
  storeProductService.get<IProduct>(params, `/${productId}/related`);

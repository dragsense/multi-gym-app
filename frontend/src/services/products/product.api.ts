import { BaseService } from "../base.service.api";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IProduct, IProductResponse } from "@shared/interfaces/products/product.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type {
  TProductData,
  TUpdateProductData,
} from "@shared/types/products/product.type";

const PRODUCT_API_PATH = "/products";
const productService = new BaseService<IProduct, TProductData, TUpdateProductData>(
  PRODUCT_API_PATH
);

export const fetchProducts = (params: IListQueryParams) =>
  productService.get<IProduct>(params);

export const fetchProduct = (id: string, params?: Record<string, unknown>) =>
  productService.getSingle<IProduct>(id, params);

export const createProduct = (data: TProductData) =>
  productService.postFormData<IProductResponse>(data);

export const updateProduct = (id: string) => (data: TUpdateProductData) =>
  productService.patchFormData<IMessageResponse>(id)(data);

export const deleteProduct = (id: string) => productService.delete(id);

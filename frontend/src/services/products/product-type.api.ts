import { BaseService } from "../base.service.api";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IProductType } from "@shared/interfaces/products/product-type.interface";
import type {
  TProductTypeData,
  TUpdateProductTypeData,
} from "@shared/types/products/product-type.type";

const PRODUCT_TYPE_API_PATH = "/product-types";
const productTypeService = new BaseService<
  IProductType,
  TProductTypeData,
  TUpdateProductTypeData
>(PRODUCT_TYPE_API_PATH);

export const fetchProductTypes = (params: IListQueryParams) =>
  productTypeService.get(params);
export const fetchProductType = (id: string, params?: IListQueryParams) =>
  productTypeService.getSingle(id, params);
export const createProductType = (data: TProductTypeData) =>
  productTypeService.post(data);
export const updateProductType = (id: string) => (data: TUpdateProductTypeData) => productTypeService.patch(id)(data);
export const deleteProductType = (id: string) => productTypeService.delete(id);

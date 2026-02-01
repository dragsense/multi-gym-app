import { BaseService } from "../base.service.api";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IAttribute } from "@shared/interfaces/products/attribute.interface";
import type {
  TAttributeData,
  TUpdateAttributeData,
} from "@shared/types/products/attribute.type";

const ATTRIBUTE_API_PATH = "/attributes";

const attributeService = new BaseService<
  IAttribute,
  TAttributeData,
  TUpdateAttributeData
>(ATTRIBUTE_API_PATH);

export const fetchAttributes = (params: IListQueryParams) =>
  attributeService.get(params);
export const fetchAttribute = (id: string, params?: IListQueryParams) =>
  attributeService.getSingle(id, params);
export const createAttribute = (data: TAttributeData) =>
  attributeService.post(data);
export const updateAttribute = (id: string) => attributeService.patch(id);
export const deleteAttribute = (id: string) => attributeService.delete(id);

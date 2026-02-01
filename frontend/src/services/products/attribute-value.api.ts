import { BaseService } from "../base.service.api";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IAttributeValue } from "@shared/interfaces/products/attribute-value.interface";
import type {
  TAttributeValueData,
  TUpdateAttributeValueData,
} from "@shared/types/products/attribute-value.type";

const ATTRIBUTE_VALUE_API_PATH = "/attribute-values";

const attributeValueService = new BaseService<
  IAttributeValue,
  TAttributeValueData,
  TUpdateAttributeValueData
>(ATTRIBUTE_VALUE_API_PATH);

export const fetchAttributeValues = (params: IListQueryParams) =>
  attributeValueService.get(params);

export const fetchAttributeValuesByAttribute = (
  attributeId: string,
  params?: IListQueryParams
) =>
  attributeValueService.get(params ?? {}, `/by-attribute/${attributeId}`);

export const fetchAttributeValue = (id: string, params?: IListQueryParams) =>
  attributeValueService.getSingle(id, params);

export const createAttributeValue = (data: TAttributeValueData) =>
  attributeValueService.post(data);

export const updateAttributeValue = (id: string) => (data: TUpdateAttributeValueData) =>
  attributeValueService.patch(id)(data);

export const deleteAttributeValue = (id: string) =>
  attributeValueService.delete(id);

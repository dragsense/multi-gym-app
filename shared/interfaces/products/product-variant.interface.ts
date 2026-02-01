import { ProductVariantDto } from '../../dtos';
import { IMessageResponse } from '../api/response.interface';

export interface IProductVariant extends ProductVariantDto {}
export interface IProductVariantResponse extends IMessageResponse {}

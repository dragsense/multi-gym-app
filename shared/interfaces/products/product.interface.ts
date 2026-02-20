import { ProductDto } from '../../dtos';
import type { IMessageResponse } from '../api/response.interface';

export interface IProduct extends ProductDto {}
export interface IProductResponse extends IMessageResponse {}

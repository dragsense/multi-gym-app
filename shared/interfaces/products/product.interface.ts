import { ProductDto } from '../../dtos';
import { IMessageResponse } from '../api/response.interface';

export interface IProduct extends ProductDto {}
export interface IProductResponse extends IMessageResponse {}

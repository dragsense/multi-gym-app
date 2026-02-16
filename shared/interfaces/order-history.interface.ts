import { EOrderStatus } from '../enums/order.enum';
import { IUser } from './user.interface';

export interface IOrderHistory {
  id: string;
  status: EOrderStatus;
  source: string;
  message?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
  changedBy?: IUser;
  createdAt?: Date;
  updatedAt?: Date;
}

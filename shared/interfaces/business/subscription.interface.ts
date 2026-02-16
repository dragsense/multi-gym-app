import { SubscriptionDto } from '../../dtos';
import { IMessageResponse } from '../api/response.interface';

export interface ISubscription extends SubscriptionDto {}
export interface ISubscriptionResponse extends IMessageResponse {
  Subscription: SubscriptionDto;
}

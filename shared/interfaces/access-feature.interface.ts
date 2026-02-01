import { IMessageResponse } from './api/response.interface';
import { AccessFeatureDto } from '../dtos/membership-dtos/access-feature-dtos';

export interface IAccessFeature extends AccessFeatureDto {};

export type TAccessFeatureResponse = {accessFeature: IAccessFeature} & IMessageResponse


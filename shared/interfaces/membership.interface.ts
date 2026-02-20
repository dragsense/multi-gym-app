import type { IMessageResponse } from './api/response.interface';
import { MembershipDto } from '../dtos/membership-dtos';

export interface IMembership extends MembershipDto {};

export type TMembershipResponse = {membership: IMembership} & IMessageResponse


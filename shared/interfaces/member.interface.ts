import { IMessageResponse } from './api/response.interface';
import { MemberDto } from '../dtos/member-dtos';

export interface IMember extends MemberDto {};

export type TMemberResponse = {member: IMember} & IMessageResponse

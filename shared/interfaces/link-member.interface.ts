import { IMessageResponse } from './api/response.interface';
import { LinkMemberDto } from '../dtos/member-dtos/link-member.dto';
import { IMember } from './member.interface';

export interface ILinkMember extends LinkMemberDto {
  primaryMember?: IMember;
  linkedMember?: IMember;
}

export type TLinkMemberResponse = { linkMember: ILinkMember } & IMessageResponse;

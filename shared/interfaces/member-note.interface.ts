import { IMessageResponse } from './api/response.interface';
import { MemberNoteDto } from '../dtos/member-note-dtos';

export interface IMemberNote extends MemberNoteDto {}

export type TMemberNoteResponse = { memberNote: IMemberNote } & IMessageResponse;

// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IMemberNote } from "@shared/interfaces/member-note.interface";
import type { TCreateMemberNoteData, TUpdateMemberNoteData } from "@shared/types/member-note.type";

// Constants
const MEMBER_NOTES_API_PATH = "/member-notes";

// Create base service instance
const memberNoteService = new BaseService<
  IMemberNote,
  TCreateMemberNoteData,
  TUpdateMemberNoteData
>(MEMBER_NOTES_API_PATH);

// Re-export common CRUD operations
export const fetchMemberNotes = (params: IListQueryParams) =>
  memberNoteService.get(params);
export const fetchMemberNote = (id: string, params: IListQueryParams) =>
  memberNoteService.getSingle(id, params);
export const createMemberNote = (data: TCreateMemberNoteData) => memberNoteService.post(data);
export const updateMemberNote = (id: string) => memberNoteService.patch(id);
export const deleteMemberNote = (id: string) => memberNoteService.delete(id);


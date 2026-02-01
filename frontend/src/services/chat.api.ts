// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type {
  ChatDto,
  ChatMessageDto,
  CreateChatDto,
  SendMessageDto,
} from "@shared/dtos/chat-dtos/chat.dto";
import type { IChatUser } from "@shared/interfaces";

// Constants
const CHAT_API_PATH = "/chat";

// Create base service instance
const chatService = new BaseService<ChatDto, CreateChatDto, Partial<CreateChatDto>>(
  CHAT_API_PATH
);

// Chat-specific API functions
export const fetchChats = (params: IListQueryParams) =>
  chatService.get<ChatDto>(params);

export const fetchChat = (id: string) =>
  chatService.getSingle<ChatDto>(id);

export const createChat = (data: CreateChatDto) =>
  chatService.post<ChatDto>(data);

export const fetchChatMessages = (chatId: string, params: IListQueryParams) =>
  chatService.get<ChatMessageDto>(params, `/${chatId}/messages`);

export const sendMessage = (data: SendMessageDto, file?: File) => {
  if (file) {
    return chatService.postFormData<ChatMessageDto>({ ...data, file } as any, undefined, "/messages");
  }
  return chatService.post<ChatMessageDto>(data as any, undefined, "/messages");
};

export const resetUnreadCount = (chatId: string) =>
  chatService.patch<{ success: boolean }>(chatId)({}, undefined, "/read");

export const deleteMessage = (
  messageId: string,
  deleteFor: "everyone" | "self" = "self"
) =>
  chatService.delete<{ success: boolean }>(messageId, { deleteFor }, "/messages");

export const clearChat = (chatId: string) =>
  chatService.delete<{ success: boolean }>(chatId, undefined, "/clear");

export const updateChat = (chatId: string, data: Partial<CreateChatDto>) =>
  chatService.patch<ChatDto>(chatId)(data);

export const deleteChat = (chatId: string) =>
  chatService.delete(chatId);

export const addUsersToChat = (chatId: string, participantIds: string[]) =>
  chatService.post<ChatDto>({ participantIds } as any, undefined, `/${chatId}/users`);

export const removeUserFromChat = (chatId: string, userId: string) =>
  chatService.delete<{ message: string }>(undefined, undefined, `/${chatId}/users/${userId}`);

export const getChatParticipants = (chatId: string) =>
  chatService.getAll<IChatUser>(undefined, `/${chatId}/users`);

export const makeUserAdmin = (chatId: string, userId: string) =>
  chatService.patch<{ message: string }>(undefined)({}, undefined, `/${chatId}/users/${userId}/admin`);

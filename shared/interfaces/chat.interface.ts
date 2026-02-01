import { ChatMessageDto, ChatDto, ChatUserDto } from "../dtos/chat-dtos";

export interface IChatMessage extends ChatMessageDto {}

export interface IChat extends ChatDto {}
export interface IChatUser extends ChatUserDto {}
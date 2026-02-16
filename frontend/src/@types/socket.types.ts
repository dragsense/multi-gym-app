import type { IChatMessage } from "@shared/interfaces/chat.interface";

export type ChatMessage = IChatMessage & {
  senderName?: string;
  senderAvatar?: string;
  timestamp?: string;
};

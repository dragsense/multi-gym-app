import { useEffect, useCallback } from "react";
import socket, { ensureConnected } from "@/utils/socket.service";
import type { ChatDto, ChatMessageDto } from "@shared/dtos/chat-dtos/chat.dto";

interface UseChatSocketCallbacks {
  onNewChat?: (chat: ChatDto) => void;
  onNewMessage?: (message: ChatMessageDto) => void;
  onMessageDeleted?: (data: {
    messageId: string;
    deletedBy: string;
    deleteFor: string;
  }) => void;
  onChatCleared?: (data: { chatId: string; clearedBy: string }) => void;
  newUnreadCount?: (data: { chatId: string; unreadCount: number }) => void;
}

export function useChatSocket(
  chatId: string | null,
  callbacks: UseChatSocketCallbacks = {}
) {
  const { onNewChat, onNewMessage, onMessageDeleted, onChatCleared, newUnreadCount } = callbacks;

  // Join/leave chat room
  useEffect(() => {
    if (!chatId) return;

    ensureConnected().then(() => {
      socket.emit("joinChat", { chatId }, () => {});
    });

    return () => {
      socket.emit("leaveChat", { chatId }, () => {});
    };
  }, [chatId]);

  // Listen for new chat
  useEffect(() => {
    if (!onNewChat) return;

    const handleNewChat = (chat: ChatDto) => {
      onNewChat(chat);
    };

    ensureConnected().then(() => {
      socket.on("newChat", handleNewChat);
    });

    return () => {
      socket.off("newChat", handleNewChat);
    };
  }, [onNewChat]);

  // Listen for new message
  useEffect(() => {
    if (!onNewMessage) return;

    const handleNewMessage = (message: ChatMessageDto) => {
      onNewMessage(message);
    };

    ensureConnected().then(() => {
      socket.on("newMessage", handleNewMessage);
    });

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [onNewMessage]);

  // Listen for message deleted
  useEffect(() => {
    if (!onMessageDeleted) return;

    const handleMessageDeleted = (data: {
      messageId: string;
      deletedBy: string;
      deleteFor: string;
    }) => {
      onMessageDeleted(data);
    };

    ensureConnected().then(() => {
      socket.on("messageDeleted", handleMessageDeleted);
    });

    return () => {
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [onMessageDeleted]);

  // Listen for chat cleared
  useEffect(() => {
    if (!onChatCleared) return;

    const handleChatCleared = (data: { chatId: string; clearedBy: string }) => {
      onChatCleared(data);
    };

    ensureConnected().then(() => {
      socket.on("chatCleared", handleChatCleared);
    });

    return () => {
      socket.off("chatCleared", handleChatCleared);
    };
  }, [onChatCleared]);


  // Listen for new unread count
  useEffect(() => {
    if (!newUnreadCount) return;

    const handleNewUnreadCount = (data: { chatId: string; unreadCount: number }) => {
      newUnreadCount(data);
    };

    ensureConnected().then(() => {
      socket.on("newUnreadCount", handleNewUnreadCount);
    });

    return () => {
      socket.off("newUnreadCount", handleNewUnreadCount);
    };

  }, [newUnreadCount]);
}


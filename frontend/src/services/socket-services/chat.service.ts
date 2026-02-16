import socket from "@/utils/socket.service";
import type { ChatMessage } from "@/@types/socket.types";

class ChatService {
  private messageHandlers: Set<(data: ChatMessage) => void> = new Set();
  private typingHandlers: Set<
    (data: { userId: string; chatId: string; isTyping: boolean }) => void
  > = new Set();

  /**
   * Listen for new messages
   */
  onMessage(callback: (data: ChatMessage) => void) {
    const handler = (data: ChatMessage) => {
      callback(data);
    };

    // Store handler for reconnection
    this.messageHandlers.add(handler);

    // Set up listeners (Socket.IO will queue these if not connected yet)
    socket.on("newMessage", handler);

    // Re-setup listeners on reconnect
    const reconnectHandler = () => {
      // Remove old listeners first to avoid duplicates
      socket.off("newMessage", handler);
      // Re-register
      socket.on("newMessage", handler);
    };

    // Only add reconnect handler if not already connected (to avoid duplicate)
    if (!socket.connected) {
      socket.once("connect", reconnectHandler);
    } else {
      // Also listen for future reconnects
      socket.on("connect", reconnectHandler);
    }

    return () => {
      this.messageHandlers.delete(handler);
      socket.off("newMessage", handler);
      socket.off("connect", reconnectHandler);
    };
  }

  /**
   * Listen for message read status updates
   */
  onMessageRead(callback: (messageId: string) => void) {
    socket.on("messageRead", callback);
    return () => {
      socket.off("messageRead", callback);
    };
  }

  /**
   * Listen for user typing indicators
   */
  onUserTyping(
    callback: (data: {
      userId: string;
      chatId: string;
      isTyping: boolean;
    }) => void
  ) {
    const handler = (data: {
      userId: string;
      chatId: string;
      isTyping: boolean;
    }) => {
      callback(data);
    };

    // Store handler for reconnection
    this.typingHandlers.add(handler);

    // Set up listeners
    socket.on("userTyping", handler);

    // Re-setup listeners on reconnect
    const reconnectHandler = () => {
      socket.off("userTyping", handler);
      socket.on("userTyping", handler);
    };

    if (!socket.connected) {
      socket.once("connect", reconnectHandler);
    } else {
      socket.on("connect", reconnectHandler);
    }

    return () => {
      this.typingHandlers.delete(handler);
      socket.off("userTyping", handler);
      socket.off("connect", reconnectHandler);
    };
  }

  /**
   * Send a message
   */
  async sendMessage(
    chatId: string,
    message: string,
    recipientId?: string
  ): Promise<ChatMessage> {
    return new Promise((resolve, reject) => {
      if (!socket.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit(
        "sendMessage",
        { chatId, message, recipientId },
        (response) => {
          if ("error" in response) {
            reject(new Error(response.error.message));
          } else if (response.message) {
            resolve(response.message);
          } else {
            reject(new Error("No message returned"));
          }
        }
      );
    });
  }

  /**
   * Join a chat room
   */
  async joinChat(chatId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!socket.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit("joinChat", { chatId }, (response) => {
        if ("error" in response) {
          reject(new Error(response.error.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Leave a chat room
   */
  async leaveChat(chatId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!socket.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit("leaveChat", { chatId }, (response) => {
        if ("error" in response) {
          reject(new Error(response.error.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string, isTyping: boolean): void {
    if (!socket.connected) return;
    socket.emit("typing", { chatId, isTyping });
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return socket.connected;
  }
}

export const chatService = new ChatService();

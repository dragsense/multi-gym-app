import socket from "@/utils/socket.service";
import type { INotification } from "@shared/interfaces/notification.interface";

class NotificationService {
  private notificationHandlers: Set<(data: INotification) => void> = new Set();

  /**
   * Listen for new notifications
   */
  onNotification(callback: (data: INotification) => void) {
    const handler = (data: INotification) => {
      callback(data);
    };

    // Store handler for reconnection
    this.notificationHandlers.add(handler);

    // Set up listeners (Socket.IO will queue these if not connected yet)
    socket.on("notification", handler);
    socket.on("newNotification", handler);

    // Re-setup listeners on reconnect (Socket.IO might lose listeners on disconnect)
    const reconnectHandler = () => {
      // Remove old listeners first to avoid duplicates
      socket.off("notification", handler);
      socket.off("newNotification", handler);
      // Re-register
      socket.on("notification", handler);
      socket.on("newNotification", handler);
    };

    // Only add reconnect handler if not already connected (to avoid duplicate)
    if (!socket.connected) {
      socket.once("connect", reconnectHandler);
    } else {
      // Also listen for future reconnects
      socket.on("connect", reconnectHandler);
    }

    return () => {
      console.log("🧹 Cleaning up notification listeners");
      this.notificationHandlers.delete(handler);
      socket.off("notification", handler);
      socket.off("newNotification", handler);
      socket.off("connect", reconnectHandler);
    };
  }

  /**
   * Listen for notification read status updates
   */
  onNotificationRead(callback: (notificationId: string) => void) {
    socket.on("notificationRead", callback);
    return () => {
      socket.off("notificationRead", callback);
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!socket.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit("markNotificationRead", { notificationId }, (response) => {
        if ("error" in response) {
          reject(new Error(response.error.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return socket.connected;
  }
}

export const notificationService = new NotificationService();

import socket from "@/utils/socket.service";

class RewardsService {
  /**
   * Listen for rewards updates
   */
  onRewardsUpdated(callback: () => void) {
    socket.on("rewardsUpdated", callback);
    return () => {
      socket.off("rewardsUpdated", callback);
    };
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return socket.connected;
  }
}

export const rewardsService = new RewardsService();



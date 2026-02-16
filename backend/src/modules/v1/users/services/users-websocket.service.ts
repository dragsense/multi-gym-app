import { Injectable } from '@nestjs/common';
import {
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ServerGateway } from '@/common/gateways/server.gateway';
import { LoggerService } from '@/common/logger/logger.service';

/**
 * User WebSocket Service
 * Add this to your users module to handle user-specific WebSocket events
 */
@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class UsersWebSocketService {
  private readonly logger = new LoggerService(UsersWebSocketService.name);
  constructor(private readonly serverGateway: ServerGateway) {}

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(userId: string, message: string) {
    this.serverGateway.emitToClient(`user_${userId}`, 'notification', {
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle user joining their room
   */
  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(
    @MessageBody('userId') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userRoom = `user_${userId}`;
    void client.join(userRoom);
    this.logger.log(`👤 User ${userId} joined room: ${userRoom}`);
    return { success: true, message: `Joined user room ${userId}` };
  }

  /**
   * Handle user leaving their room
   */
  @SubscribeMessage('leaveUserRoom')
  handleLeaveUserRoom(
    @MessageBody('userId') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userRoom = `user_${userId}`;
    void client.leave(userRoom);
    this.logger.log(`👤 User ${userId} left room: ${userRoom}`);
    return { success: true, message: `Left user room ${userId}` };
  }
}

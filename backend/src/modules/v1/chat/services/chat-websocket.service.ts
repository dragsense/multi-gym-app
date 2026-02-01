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
import { ChatDto } from '@shared/dtos/chat-dtos/chat.dto';

/**
 * Chat WebSocket Service
 * Handles chat room join/leave events for real-time messaging
 */
@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatWebSocketService {
  private readonly logger = new LoggerService(ChatWebSocketService.name);

  constructor(public readonly serverGateway: ServerGateway) {}

  /**
   * Handle user joining a chat room
   */
  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const chatRoom = `chat:${data.chatId}`;
    void client.join(chatRoom);
    this.logger.log(`💬 Client ${client.id} joined chat room: ${chatRoom}`);
    return { success: true, message: `Joined chat room ${data.chatId}` };
  }

  /**
   * Handle user leaving a chat room
   */
  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const chatRoom = `chat:${data.chatId}`;
    void client.leave(chatRoom);
    this.logger.log(`💬 Client ${client.id} left chat room: ${chatRoom}`);
    return { success: true, message: `Left chat room ${data.chatId}` };
  }

  /**
   * Emit message to chat room
   */
  emitToChatRoom(chatId: string, event: string, data: unknown): void {
    const chatRoom = `chat:${chatId}`;
    this.serverGateway.emitToClient(chatRoom, event, data);
  }

  /**
   * Emit to a specific user room
   */
  emitToUserRoom(clientId: string, event: string, data: unknown): void {
    this.serverGateway.emitToClient(clientId, event, data);
  }
}

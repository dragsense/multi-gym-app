import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '@/common/logger/logger.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ServerGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new LoggerService(ServerGateway.name);
  private static instance: ServerGateway;

  constructor() {}

  afterInit() {
    this.logger.log('🚀 Server Gateway initialized');
    ServerGateway.instance = this;
  }

  /**
   * Get the global ServerGateway instance
   */
  static getInstance(): ServerGateway {
    return ServerGateway.instance;
  }

  /**
   * Emit a message to all connected clients
   */
  emitToAll(event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not initialized. Cannot emit message.',
      );
      return;
    }

    this.server.emit(event, data);
    this.logger.log(`📡 Emitted '${event}' to all clients`);
  }

  /**
   * Emit a message to a specific client by socket ID
   */
  emitToClient(clientId: string, event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not initialized. Cannot emit message.',
      );
      return;
    }

    this.server.to(clientId).emit(event, data);
    this.logger.log(`📡 Emitted '${event}' to client ${clientId}`);
  }

  /**
   * Emit a message to multiple clients by socket IDs
   */
  emitToClients(clientIds: string[], event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not initialized. Cannot emit message.',
      );
      return;
    }

    clientIds.forEach((clientId) => {
      this.server.to(clientId).emit(event, data);
    });

    this.logger.log(`📡 Emitted '${event}' to ${clientIds.length} clients`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
  }

  /**
   * Get all connected client IDs
   */
  getConnectedClientIds(): string[] {
    if (!this.server) {
      return [];
    }
    return Array.from(this.server.sockets.sockets.keys());
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    if (!this.server) {
      return 0;
    }
    return this.server.sockets.sockets.size;
  }
}

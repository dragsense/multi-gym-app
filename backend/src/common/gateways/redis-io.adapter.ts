import { INestApplication, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server as SocketIOServer, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, type RedisClientType } from 'redis';
import type { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: unknown;

  constructor(
    private readonly app: INestApplication,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const cache =
      (this.configService.get('cache') as {
        host?: string;
        port?: number;
        password?: string;
        db?: number;
      }) || {};
    const host = cache.host ?? process.env.CACHE_HOST ?? 'localhost';
    const portNum = Number(cache.port ?? process.env.CACHE_PORT ?? 6379);
    const password = cache.password ?? process.env.CACHE_PASSWORD ?? undefined;
    const db = Number(cache.db ?? process.env.CACHE_DB ?? 0);

    const url = `redis://${password ? `:${encodeURIComponent(password)}@` : ''}${host}:${portNum}/${db}`;
    const pubClient: RedisClientType = createClient({ url });
    const subClient: RedisClientType = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(
      pubClient as any,
      subClient as any,
    ) as unknown;
    this.logger.log(
      `Socket.IO Redis adapter enabled at ${host}:${portNum}/${db}`,
    );
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(
      port,
      options,
    ) as unknown as SocketIOServer;

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor as any);
    }

    return server;
  }
}

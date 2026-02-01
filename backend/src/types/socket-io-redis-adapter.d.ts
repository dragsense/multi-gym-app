declare module '@socket.io/redis-adapter' {
  import type { AdapterConstructor } from 'socket.io-adapter';
  export function createAdapter(
    pubClient: unknown,
    subClient: unknown,
  ): AdapterConstructor;
}

import { AsyncLocalStorage } from 'async_hooks';

export class RequestContext {
  private static readonly asyncLocalStorage = new AsyncLocalStorage<
    Map<string, unknown>
  >();

  static run<T>(callback: () => T): T {
    const context = new Map<string, unknown>();
    return this.asyncLocalStorage.run(context, callback);
  }

  static get<T = unknown>(key: string): T | undefined {
    const context = this.asyncLocalStorage.getStore();
    return context?.get(key) as T | undefined;
  }

  static set(key: string, value: unknown): void {
    const context = this.asyncLocalStorage.getStore();
    if (context) {
      context.set(key, value);
    }
  }
}

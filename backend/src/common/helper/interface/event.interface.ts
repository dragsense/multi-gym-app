/**
 * Generic event interface for any type of events
 */
export interface Event {
  type: string;
  data: any;
  timestamp: Date;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Event listener function type - simplified for NestJS EventEmitter
 */
export type EventListener = (payload: any) => Promise<void> | void;

/**
 * Simple event service interface
 */
export interface EventService {
  emit(eventType: string, payload: any): void;
  emitEvent(type: string, data: any, source?: string, metadata?: Record<string, any>): void;
}
import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import {
  EActivityType,
  EActivityStatus,
} from '@shared/enums/activity-log.enum';
import { ActionHandler, ActionResult } from '../interface/action.interface';

@Injectable()
export class ActionRegistryService implements OnModuleInit {
  private readonly logger = new LoggerService(ActionRegistryService.name);
  private actions: Map<string, ActionHandler> = new Map();

  constructor(private readonly activityLogsService: ActivityLogsService) {}

  async onModuleInit() {
    this.logger.log('🚀 Action Registry Service initialized');
  }

  /**
   * Log activity for action execution
   */
  private async logActivity(
    type: EActivityType,
    description: string,
    status: EActivityStatus,
    metadata?: Record<string, any>,
    userId?: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const activityData: any = {
        description,
        type,
        status,
        metadata,
        errorMessage,
      };

      if (userId) {
        activityData.userId = userId;
      }

      await this.activityLogsService.create(activityData);
    } catch (error) {
      this.logger.error(`Failed to log action activity: ${error.message}`);
    }
  }

  /**
   * Register a new action handler
   */
  registerAction(actionName: string, handler: ActionHandler): void {
    this.actions.set(actionName, handler);
    this.logger.log(`📝 Registered action: ${actionName}`);
  }

  /**
   * Unregister an action handler
   */
  unregisterAction(actionName: string): boolean {
    const removed = this.actions.delete(actionName);
    if (removed) {
      this.logger.log(`🗑️ Unregistered action: ${actionName}`);
    }
    return removed;
  }

  /**
   * Get an action handler
   */
  getAction(actionName: string): ActionHandler | undefined {
    return this.actions.get(actionName);
  }

  /**
   * Get all registered actions
   */
  getAllActions(): ActionHandler[] {
    return Array.from(this.actions.values());
  }

  /**
   * Check if an action is registered
   */
  hasAction(actionName: string): boolean {
    return this.actions.has(actionName);
  }

  /**
   * Execute an action
   */
  async executeAction(
    actionName: string,
    data?: Record<string, any>,
    entityId?: string,
    userId?: string,
  ): Promise<ActionResult> {
    const startTime = Date.now();

    this.logger.log(
      `🔄 Executing action: ${actionName} (Entity: ${entityId}, User: ${userId})`,
    );

    // Log action start
    await this.logActivity(
      EActivityType.ACTION_START,
      `Action started: ${actionName}`,
      EActivityStatus.PENDING,
      {
        actionName,
        entityId,
        userId,
        startTime: new Date().toISOString(),
      },
      userId,
    );

    const handler = this.actions.get(actionName);
    if (!handler) {
      const error = `Action '${actionName}' not found in registry`;
      this.logger.error(error);

      // Log action error
      await this.logActivity(
        EActivityType.ACTION_ERROR,
        `Action not found: ${actionName}`,
        EActivityStatus.FAILED,
        {
          actionName,
          entityId,
          userId,
          errorMessage: error,
        },
        userId,
        error,
      );

      return {
        success: false,
        error,
        executionTime: Date.now() - startTime,
      };
    }

    try {
      // Set timeout if specified
      let result;
      if (handler.timeout) {
        result = await Promise.race([
          handler.handler(data, entityId, userId),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(new Error(`Action timeout after ${handler.timeout}ms`)),
              handler.timeout,
            ),
          ),
        ]);
      } else {
        result = await handler.handler(data, entityId, userId);
      }

      const executionTime = Date.now() - startTime;
      const actionResult: ActionResult = {
        success: true,
        data: result,
        executionTime,
      };

      // Log action success
      await this.logActivity(
        EActivityType.ACTION_SUCCESS,
        `Action completed successfully: ${actionName}`,
        EActivityStatus.SUCCESS,
        {
          actionName,
          entityId,
          userId,
          executionTime,
          result,
          endTime: new Date().toISOString(),
        },
        userId,
      );

      this.logger.log(
        `✅ Action executed successfully: ${actionName} (${executionTime}ms)`,
      );
      return actionResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const actionResult: ActionResult = {
        success: false,
        error: error.message,
        executionTime,
      };

      // Log action error
      await this.logActivity(
        EActivityType.ACTION_ERROR,
        `Action execution failed: ${actionName}`,
        EActivityStatus.FAILED,
        {
          actionName,
          entityId,
          userId,
          executionTime,
          errorMessage: error.message,
          endTime: new Date().toISOString(),
        },
        userId,
        error.message,
      );

      this.logger.error(
        `❌ Action execution failed: ${actionName} - ${error.message} (${executionTime}ms)`,
      );
      return actionResult;
    }
  }

  /**
   * Execute action with retry logic
   */
  async executeActionWithRetry(
    actionName: string,
    data?: Record<string, any>,
    entityId?: string,
    userId?: string,
    maxRetries: number = 3,
    retryDelay: number = 1000,
  ): Promise<ActionResult> {
    let lastResult: ActionResult;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.logger.log(
        `🔄 Attempt ${attempt}/${maxRetries} for action: ${actionName}`,
      );

      lastResult = await this.executeAction(actionName, data, entityId, userId);

      if (lastResult.success) {
        return lastResult;
      }

      if (attempt < maxRetries) {
        this.logger.log(
          `⏳ Retrying action ${actionName} in ${retryDelay}ms...`,
        );
        await this.delay(retryDelay);
        retryDelay *= 2; // Exponential backoff
      }
    }

    this.logger.error(
      `❌ Action ${actionName} failed after ${maxRetries} attempts`,
    );
    return lastResult!;
  }

  /**
   * Utility method for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

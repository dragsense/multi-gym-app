import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ActionRegistryService } from '@/common/helper/services/action-registry.service';
import { RequestContext } from '@/common/context/request-context';

@Processor('schedule')
@Injectable()
export class ScheduleProcessor {
  private readonly logger = new Logger(ScheduleProcessor.name);

  constructor(private readonly actionRegistryService: ActionRegistryService) {}

  /**
   * Handle all scheduled jobs using action registry
   * Sets tenant context from schedule data before executing the action
   */
  @Process('*')
  async handleScheduledJob(job: Job): Promise<void> {
    const { action, tenantId, ...data } = job.data;

    this.logger.log(
      `Processing scheduled job ${job.id} with action: ${action}${tenantId ? ` for tenant: ${tenantId}` : ''}`,
    );

    try {
      // Get the handler from the action registry
      const actionHandler = this.actionRegistryService.getAction(action);

      if (!actionHandler) {
        this.logger.warn(`No handler found for action: ${action}`);
        return;
      }

      // Execute within RequestContext to set tenant context
      // This ensures all database operations use the correct tenant database
      await RequestContext.run(async () => {
        // Set tenant context if provided
        if (tenantId) {
          RequestContext.set('tenantId', tenantId);
          this.logger.debug(`Set tenant context for scheduled job: ${tenantId}`);
        }

        // Execute the handler with job data (include tenantId in data for handlers that need it)
        await actionHandler.handler({ ...data, tenantId }, data.entityId, data.userId);
      });

      this.logger.log(`Scheduled job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Scheduled job ${job.id} failed:`, error);
      throw error;
    }
  }
}

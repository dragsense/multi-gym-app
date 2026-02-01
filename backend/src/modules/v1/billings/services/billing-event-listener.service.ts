import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BillingsService } from '../billings.service';
import { Billing } from '../entities/billing.entity';
import { ScheduleService } from '@/common/schedule/schedule.service';
import { EventPayload } from '@/common/helper/services/event.service';
import { ActionRegistryService } from '@/common/helper/services/action-registry.service';
import { EBillingStatus } from '@shared/enums/billing.enum';
import { BillingEmailService } from './billing-email.service';
import { UsersService } from '@/modules/v1/users/users.service';
import { BillingNotificationService } from './billing-notification.service';
import { RequestContext } from '@/common/context/request-context';

@Injectable()
export class BillingEventListenerService implements OnModuleInit {
  private readonly logger = new Logger(BillingEventListenerService.name);

  constructor(
    private readonly billingsService: BillingsService,
    private readonly scheduleService: ScheduleService,
    @InjectQueue('billing') private billingQueue: Queue,
    private readonly actionRegistryService: ActionRegistryService,
    private readonly billingEmailService: BillingEmailService,
    private readonly usersService: UsersService,
    private readonly billingNotificationService: BillingNotificationService,
  ) {}

  onModuleInit() {
    // Register billing actions with action registry

    this.actionRegistryService.registerAction('send-billing-reminder', {
      handler: this.handleSendBillingReminder.bind(this),
      description: 'Send billing reminder email',
      retryable: true,
      timeout: 10000,
    });
  }

  /**
   * Handle billing created event - setup reminders if enabled
   */
  @OnEvent('billing.crud.create')
  async handleBillingCreated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    // Get tenantId from event payload data (passed from CrudService)
    const data = payload.data as { createdBy?: string; tenantId?: string };
    const tenantId = data?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(payload.entityId, {
          _relations: ['recipientUser'],
        });
        if (!billing) throw new NotFoundException('Billing not found');
        this.logger.log(`Billing created: ${billing.title} (ID: ${billing.id})`);

        // Send notifications
        await Promise.all([
          this.billingNotificationService.notifyBillingCreated(
            billing,
            data?.createdBy,
          ),
          this.billingNotificationService.notifyAdminsBillingCreated(
            billing,
            data?.createdBy,
          ),
        ]);

        // Send confirmation to trainer
        await this.billingQueue.add(
          'send-billing-confirmation',
          {
            billingId: billing.id,
            recipientId: billing.recipientUser.id,
            tenantId, // Pass tenant context for background job
          },
          {
            delay: 10000,
          },
        );

        // Setup reminders if enabled (pass tenantId for multi-tenant support)
        if (billing.enableReminder) {
          await this.setupBillingReminders(billing, tenantId);
        }
      } catch (error) {
        this.logger.error(
          `Failed to handle billing creation for billing ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Handle billing updated event - update reminders if needed
   */
  @OnEvent('billing.crud.update')
  async handleBillingUpdated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    // Get tenantId from event payload data (passed from CrudService)
    const data = payload.data as { updatedBy?: string; tenantId?: string };
    const tenantId = data?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(payload.entityId, {
          _relations: ['recipientUser'],
        });
        if (!billing) throw new NotFoundException('Billing not found');
        this.logger.log(`Billing updated: ${billing.title} (ID: ${billing.id})`);

        const oldBilling = payload.oldEntity as Billing | undefined;

        // Send notification if billing was updated
        if (
          oldBilling &&
          JSON.stringify(billing) !== JSON.stringify(oldBilling)
        ) {
          await this.billingNotificationService.notifyBillingUpdated(
            billing,
            data?.updatedBy,
          );

          // Queue billing updated email
          await this.billingQueue.add(
            'send-billing-updated',
            {
              billingId: billing.id,
              recipientId: billing.recipientUser.id,
              tenantId, // Pass tenant context for background job
            },
            {
              delay: 10000,
            },
          );
        }

        // Update reminders if billing details changed (pass tenantId for multi-tenant support)
        if (
          billing.enableReminder &&
          JSON.stringify(billing.reminderConfig) !==
            JSON.stringify(oldBilling?.reminderConfig)
        ) {
          await this.setupBillingReminders(billing, tenantId);
        }
      } catch (error) {
        this.logger.error(
          `Failed to handle billing update for billing ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Handle billing status changed to PAID
   */
  @OnEvent('billing.status.paid')
  async handleBillingPaid(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    // Get tenantId from event payload data
    const tenantId = (payload.data as any)?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(payload.entityId, {
          _relations: ['recipientUser'],
          _select: ['recipientUser.id'],
        });
        if (!billing) throw new NotFoundException('Billing not found');
        // Send paid confirmation to trainer
        await this.billingQueue.add(
          'send-billing-paid',
          {
            billingId: billing.id,
            recipientId: billing.recipientUser.id,
            tenantId, // Pass tenant context for background job
          },
          {
            delay: 10000,
          },
        );
      } catch (error) {
        this.logger.error(
          `Failed to handle billing paid for billing ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Handle billing deleted event - cleanup reminders
   */
  @OnEvent('billing.crud.delete')
  async handleBillingDeleted(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    // Get tenantId from event payload data
    const tenantId = (payload.data as any)?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(
          payload.entityId,
          {
            _relations: ['recipientUser'],
          },
          true,
        );

        if (!billing) throw new NotFoundException('Billing not found');

        this.logger.log(`Billing deleted: ID ${billing.id}`);

        await this.billingNotificationService.notifyBillingDeleted(billing);

        await this.billingQueue.add(
          'send-billing-deleted',
          {
            billingId: billing.id,
            recipientId: billing.recipientUser.id,
            tenantId, // Pass tenant context for background job
          },
          {
            delay: 10000,
          },
        );

        // Remove all associated reminders
        await this.removeBillingReminders(billing.id);
      } catch (error) {
        this.logger.error(
          `Failed to handle billing deletion for billing ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Handle send billing reminder
   */
  private async handleSendBillingReminder(data: any): Promise<void> {
    const { billingId, recipientId } = data;

    try {
      const billing = await this.billingsService.getSingle(billingId, {
        _relations: ['recipientUser'],
      });
      if (!billing) throw new NotFoundException('Billing not found');
      const user = await this.usersService.getUser(recipientId as string);
      if (!user) throw new NotFoundException('User not found');
      await this.billingEmailService.sendBillingReminder(
        billing,
        user.email,
        user.firstName + ' ' + user.lastName,
      );
    } catch (error) {
      this.logger.error(`Failed to send billing reminder:`, error);
      throw error;
    }
  }

  /**
   * Setup billing reminders based on configuration
   * @param tenantId - Tenant ID for multi-tenant database routing (passed from event payload)
   */
  private async setupBillingReminders(billing: Billing, tenantId?: string): Promise<void> {
    if (!billing.reminderConfig || !billing.enableReminder) {
      return;
    }

    const { sendBefore = [] } = billing.reminderConfig;

    // Remove existing reminders first
    await this.removeBillingReminders(billing.id);

    // Create new reminders based on configuration
    for (const sendBeforeValue of sendBefore) {
      await this.createBillingReminderSchedule(billing, sendBeforeValue, tenantId);
    }

    this.logger.log(
      `Setup ${sendBefore.length} reminder(s) for billing: ${billing.title}${tenantId ? ` (tenant: ${tenantId})` : ''}`,
    );
  }

  /**
   * Remove all reminders for a billing
   */
  private async removeBillingReminders(billingId: string): Promise<void> {
    try {
      // Find and remove all schedules associated with this billing
      const schedules = await this.scheduleService.getAll(
        { entityId: billingId },
        {},
      );

      for (const schedule of schedules) {
        await this.scheduleService.delete(schedule.id);
      }

      this.logger.log(
        `Removed ${schedules.length} reminder(s) for billing ID: ${billingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove reminders for billing ${billingId}:`,
        error,
      );
    }
  }

  /**
   * Create a billing reminder schedule
   * @param tenantId - Tenant ID for multi-tenant database routing (passed from event payload)
   */
  private async createBillingReminderSchedule(
    billing: Billing,
    sendBefore: number,
    tenantId?: string,
  ): Promise<void> {
    try {
      const reminderDate = new Date(billing.dueDate);
      reminderDate.setDate(reminderDate.getDate() - sendBefore);

      // Skip if reminder time has already passed
      if (reminderDate <= new Date()) {
        this.logger.warn(
          `Reminder time has passed for billing ${billing.title}, skipping`,
        );
        return;
      }

      const scheduleData = {
        title: `Billing Reminder - ${billing.title}`,
        description: `Reminder for ${billing.title} due on ${billing.dueDate.toISOString()}`,
        action: 'send-billing-reminder',
        entityId: billing.id,
        nextRunDate: reminderDate.toISOString(),
        status: 'active' as any,
        retryOnFailure: false,
        tenantId, // Include tenant context for multi-tenant database routing
        data: {
          billingId: billing.id,
          recipientId: billing.recipientUser.id,
          tenantId, // Also store in data for action handlers
        },
      };
      await this.scheduleService.createSchedule(scheduleData);

      this.logger.log(
        `Created reminder for billing ${billing.title} at ${reminderDate.toISOString()}${tenantId ? ` (tenant: ${tenantId})` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create reminder schedule for billing ${billing.id}:`,
        error,
      );
    }
  }
}

import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SessionsService } from '../sessions.service';
import { Session } from '../entities/session.entity';
import { ScheduleService } from '@/common/schedule/schedule.service';
import { EventPayload } from '@/common/helper/services/event.service';
import { EReminderSendBefore } from '@shared/enums';
import {
  EScheduleFrequency,
  EScheduleStatus,
} from '@shared/enums/schedule.enum';
import { SessionEmailService } from './session-email.service';
import { UsersService } from '@/modules/v1/users/users.service';
import { ActionRegistryService } from '@/common/helper/services/action-registry.service';
import { SessionNotificationService } from './session-notification.service';
import { RequestContext } from '@/common/context/request-context';

@Injectable()
export class SessionEventListenerService implements OnModuleInit {
  private readonly logger = new Logger(SessionEventListenerService.name);

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly scheduleService: ScheduleService,
    @InjectQueue('session') private sessionQueue: Queue,
    private readonly sessionEmailService: SessionEmailService,
    private readonly usersService: UsersService,
    private readonly actionRegistryService: ActionRegistryService,
    private readonly sessionNotificationService: SessionNotificationService,
  ) {}

  onModuleInit() {
    // Register session actions with action registry
    this.actionRegistryService.registerAction('send-session-reminder', {
      handler: this.handleSendSessionReminder.bind(this),
      description: 'Send session reminder email',
      retryable: true,
      timeout: 10000,
    });

    this.actionRegistryService.registerAction('mark-session-passed', {
      handler: this.handleMarkSessionPassed.bind(this),
      description: 'Mark session as passed after it ends',
      retryable: true,
      timeout: 10000,
    });
  }

  /**
   * Handle session created event - setup reminders if enabled
   */
  @OnEvent('session.crud.create')
  async handleSessionCreated(payload: EventPayload): Promise<void> {
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
        const session = await this.sessionsService.getSingle(payload.entityId, {
          _relations: ['trainer.user', 'members.user'],
        });
        if (!session) throw new NotFoundException('Session not found');
        this.logger.log(`Session created: ${session.title} (ID: ${session.id})`);

        // Send notifications
        await Promise.all([
          this.sessionNotificationService.notifyTrainerSessionCreated(
            session,
            data?.createdBy,
          ),
          this.sessionNotificationService.notifyMembersSessionCreated(
            session,
            data?.createdBy,
          ),
          /*   this.sessionNotificationService.notifyAdminsSessionCreated(
            session,
            data?.createdBy,
          ), */
        ]);

        await this.sessionQueue.add(
          'send-session-confirmation',
          {
            sessionId: session.id,
            recipientId: session.trainer.user.id,
            tenantId, // Pass tenant context for background job
          },
          {
            delay: 10000,
          },
        );

        for (const memberUser of session.members) {
          await this.sessionQueue.add(
            'send-session-confirmation',
            {
              sessionId: session.id,
              recipientId: memberUser.user.id,
              tenantId, // Pass tenant context for background job
            },
            {
              delay: 10000,
            },
          );
        }

        // Setup reminders if enabled (pass tenantId for multi-tenant support)
        if (session.enableReminder) {
          await this.setupSessionReminders(session, tenantId);
        }

        await this.scheduleSessionAutoPass(session, tenantId);
      } catch (error) {
        this.logger.error(
          `Failed to handle session creation for session ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Handle session updated event - update reminders if needed
   */
  @OnEvent('session.crud.update')
  async handleSessionUpdated(payload: EventPayload): Promise<void> {
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
        const session = await this.sessionsService.getSingle(payload.entityId, {
          _relations: ['trainer.user', 'members.user'],
        });
        if (!session) throw new NotFoundException('Session not found');
        this.logger.log(`Session updated: ${session.title} (ID: ${session.id})`);

        const oldSession = payload.oldEntity as Session | undefined;

        // Send notification if session was updated
        if (oldSession) {
          await this.sessionNotificationService.notifySessionUpdated(
            session,
            data?.updatedBy,
          );

          if (oldSession.enableReminder !== session.enableReminder) {
            if (session.enableReminder) {
              await this.setupSessionReminders(session, tenantId);
            } else {
              await this.removeSessionReminders(session.id);
            }
          }
        }

        if (oldSession?.status !== session.status) {
          await this.sessionQueue.add(
            'send-session-status-update',
            {
              sessionId: session.id,
              recipientId: session.trainer.user.id,
              tenantId, // Pass tenant context for background job
            },
            {
              delay: 10000,
            },
          );

          for (const member of session.members) {
            await this.sessionQueue.add(
              'send-session-status-update',
              {
                sessionId: session.id,
                recipientId: member.user.id,
                tenantId, // Pass tenant context for background job
              },
              {
                delay: 10000,
              },
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to handle session update for session ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Handle session deleted event - cleanup reminders
   */
  @OnEvent('session.crud.delete')
  async handleSessionDeleted(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    // Get tenantId from event payload data (passed from CrudService)
    const tenantId = (payload.data as any)?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const session = await this.sessionsService.getSingle(
          payload.entityId,
          {
            _relations: ['trainer.user', 'members.user'],
          },
          true,
        );

        if (!session) throw new NotFoundException('Session not found');

        this.logger.log(`Session deleted: ID ${session.id}`);

        await this.sessionNotificationService.notifySessionDeleted(session);

        await this.sessionQueue.add(
          'send-session-deleted',
          {
            sessionId: session.id,
            recipientId: session.trainer.user.id,
            tenantId, // Pass tenant context for background job
          },
          {
            delay: 10000,
          },
        );

        for (const member of session.members) {
          await this.sessionQueue.add(
            'send-session-deleted',
            {
              sessionId: session.id,
              recipientId: member.user.id,
              tenantId, // Pass tenant context for background job
            },
            {
              delay: 10000,
            },
          );
        }

        // Remove all associated reminders
        await this.removeSessionReminders(session.id);
      } catch (error) {
        this.logger.error(
          `Failed to handle session deletion for session ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Handle send session reminder
   */
  private async handleSendSessionReminder(data: {
    sessionId: string;
    recipientId: string;
  }): Promise<void> {
    const { sessionId, recipientId } = data;

    try {
      const session = await this.sessionsService.getSingle(sessionId);
      if (!session) throw new NotFoundException('Session not found');
      const user = await this.usersService.getUser(recipientId);
      await this.sessionEmailService.sendSessionReminder(
        session,
        user.email,
        user.firstName + ' ' + user.lastName,
      );
    } catch (error) {
      this.logger.error(`Failed to send session reminder:`, error);
      throw error;
    }
  }

  /**
   * Setup reminders for a session
   * @param tenantId - Tenant ID for multi-tenant database routing (passed from event payload)
   */
  private async setupSessionReminders(session: Session, tenantId?: string): Promise<void> {
    try {
      const reminderConfig = session.reminderConfig;
      const { sendBefore = [EReminderSendBefore.ONE_DAY] } =
        reminderConfig || {};

      // Remove existing reminders first
      await this.removeSessionReminders(session.id);
      // Create new reminders based on configuration
      for (const sendBeforeValue of sendBefore) {
        await this.createReminderSchedule(session, sendBeforeValue, tenantId);
      }

      this.logger.log(
        `Setup ${reminderConfig?.sendBefore?.length || 0} reminder(s) for session: ${session.title}${tenantId ? ` (tenant: ${tenantId})` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to setup reminders for session ${session.id}:`,
        error,
      );
    }
  }

  /**
   * Remove all reminders for a session
   */
  private async removeSessionReminders(sessionId: string): Promise<void> {
    try {
      // Find and remove all schedules associated with this session
      const schedules = await this.scheduleService.getAll(
        { entityId: sessionId },
        {},
      );

      for (const schedule of schedules) {
        await this.scheduleService.delete(schedule.id);
      }

      this.logger.log(
        `Removed ${schedules.length} reminder(s) for session ID: ${sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove reminders for session ${sessionId}:`,
        error,
      );
    }
  }

  /**
   * Create a reminder schedule
   * @param tenantId - Tenant ID for multi-tenant database routing (passed from event payload)
   */
  private async createReminderSchedule(
    session: Session,
    sendBefore: EReminderSendBefore,
    tenantId?: string,
  ): Promise<void> {
    try {
      const reminderDate = new Date(session.startDateTime);
      reminderDate.setMinutes(reminderDate.getMinutes() - sendBefore);

      // Skip if reminder time has already passed
      if (reminderDate <= new Date()) {
        this.logger.warn(
          `Reminder time has passed for session ${session.title}, skipping`,
        );
        return;
      }

      const scheduleData = {
        title: `Session Reminder - ${session.title}`,
        description: `Reminder for ${session.title} starting at ${session.startDateTime}`,
        action: 'send-session-reminder',
        entityId: session.id,
        nextRunDate: reminderDate.toISOString(),
        status: EScheduleStatus.ACTIVE,
        retryOnFailure: false,
        tenantId, // Include tenant context for multi-tenant database routing
        data: {
          sessionId: session.id,
          recipientId: session.trainer.user.id,
          tenantId, // Also store in data for action handlers
        },
      };
      await this.scheduleService.createSchedule(scheduleData);

      const members = session.members;
      for (const member of members) {
        scheduleData.data = {
          sessionId: session.id,
          recipientId: member.user.id,
          tenantId, // Also store in data for action handlers
        };
        await this.scheduleService.createSchedule(scheduleData);
      }

      this.logger.log(
        `Created reminder for session ${session.title} at ${reminderDate.toISOString()}${tenantId ? ` (tenant: ${tenantId})` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create reminder schedule for session ${session.id}:`,
        error,
      );
    }
  }

  /**
   * Schedule automatic marking of a session as PASSED at end time
   * For recurring sessions, creates a recurring schedule based on recurrence config
   * @param tenantId - Tenant ID for multi-tenant database routing (passed from event payload)
   */
  private async scheduleSessionAutoPass(session: Session, tenantId?: string): Promise<void> {
    try {
      if (!session.enableRecurrence) {
        this.logger.log(
          `Session ${session.title} is not recurring, skipping auto-pass`,
        );
        return;
      }

      // Calculate end date/time for the first occurrence
      const startDateTime = session.startDateTime;

      // Extract time of day from end date (HH:MM format)
      const hours = startDateTime.getHours().toString().padStart(2, '0');
      const minutes = startDateTime.getMinutes().toString().padStart(2, '0');
      const timeOfDay = `${hours}:${minutes}`;

      // Create recurring schedule with same frequency config
      await this.scheduleService.createSchedule({
        title: `Session Auto-Pass - ${session.title}`,
        description: `Auto mark ${session.title} as passed (recurring)`,
        action: 'mark-session-passed',
        entityId: session.id,
        frequency:
          session.recurrenceConfig?.frequency || EScheduleFrequency.ONCE,
        weekDays: session.recurrenceConfig?.weekDays || [],
        monthDays: session.recurrenceConfig?.monthDays || [],
        startDate: session.startDateTime.toISOString(),
        endDate: session.recurrenceEndDate?.toISOString() || undefined,
        timeOfDay: timeOfDay,
        retryOnFailure: true,
        tenantId, // Include tenant context for multi-tenant database routing
        data: {
          sessionId: session.id,
          tenantId, // Also store in data for action handlers
        },
      });

      this.logger.log(
        `Scheduled auto-pass for session ${session.title} at ${startDateTime.toISOString()}${tenantId ? ` (tenant: ${tenantId})` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule auto-pass for session ${session.id}:`,
        error,
      );
    }
  }

  /**
   * Handle mark session passed
   */
  private async handleMarkSessionPassed(data: any): Promise<void> {
    const { sessionId } = data as { sessionId: string };
    try {
      const idWithDateParts = sessionId.split('@');
      const originalSessionId = idWithDateParts[0];

      const existingSession = await this.sessionsService.getSingle(
        originalSessionId,
        {
          _relations: ['trainer', 'members'],
        },
      );

      if (!existingSession) {
        throw new NotFoundException('Session not found');
      }

      await this.sessionsService.checkActualSessionsAndCreate(existingSession);

      this.logger.log(`Created actual session: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create actual session: ${sessionId}:`,
        error,
      );
      throw error;
    }
  }
}

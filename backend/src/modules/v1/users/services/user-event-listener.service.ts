import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { User } from '@/common/base-user/entities/user.entity';
import { EventPayload } from '@/common/helper/services/event.service';
import { UserNotificationService } from './user-notification.service';
import { RequestContext } from '@/common/context/request-context';

@Injectable()
export class UserEventListenerService {
  private readonly logger = new Logger(UserEventListenerService.name);

  constructor(
    @InjectQueue('user') private userQueue: Queue,
    private readonly userNotificationService: UserNotificationService,
  ) {
    this.logger.log('✅ UserEventListenerService initialized');

    // 🔄 Queue Event Listeners
    this.userQueue.on('waiting', (jobId) =>
      this.logger.log(`⏳ Job waiting: ${jobId}`),
    );

    this.userQueue.on('active', (job) =>
      this.logger.log(`⚙️ Job active: ${job.id}`),
    );

    this.userQueue.on('completed', (job) =>
      this.logger.log(`✅ Job completed: ${job.id}`),
    );

    this.userQueue.on('failed', (job, err) =>
      this.logger.error(`💥 Job failed: ${job.id} - ${err.message}`),
    );
  }

  /**
   * Handle user created event - send welcome email
   */
  @OnEvent('user.crud.create')
  async handleUserCreated(payload: EventPayload): Promise<void> {
    // Check if this is a user creation event
    if (!payload.entity) {
      this.logger.warn('User creation event received but entity is null');
      return;
    }

    const user = payload.entity as User;
    const data = payload.data as { tempPassword?: string; createdBy?: string; tenantId?: string };
    const tenantId = data?.tenantId;

    this.logger.log(
      `📥 Event received: Creating queue job for user ${user.id}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      // Send notifications to user and admins
      try {
        await this.userNotificationService.handleUserCreated(
          user,
          data?.createdBy,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to send notifications for ${user.email}: ${errorMessage}`,
        );
      }

      try {
        const job = await this.userQueue.add(
          'send-welcome-email',
          {
            userId: user.id,
            tempPassword: data?.tempPassword,
            createdBy: data?.createdBy,
            tenantId, // Pass tenant context for background job
          },
          {
            // Temporarily removed delay for debugging
            // delay: 10000,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: {
              count: 100,
            },
            removeOnFail: {
              age: 259200,
              count: 100,
            },
            timeout: 30000,
          },
        );

        this.logger.log(`✅ Job ${job.id} added to queue for user ${user.email}`);

        // Log job status for debugging
        const jobCounts = await this.userQueue.getJobCounts();
        this.logger.log(`📊 Queue stats: ${JSON.stringify(jobCounts)}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `❌ Failed to add job to queue for ${user.email}: ${errorMessage}`,
        );
      }
    });
  }

  /**
   * Handle user updated event - send notification if needed
   */
  @OnEvent('user.crud.update')
  async handleUserUpdated(payload: EventPayload): Promise<void> {
    // Check if this is a user update event
    if (!payload.entity) {
      this.logger.warn('User update event received but entity is null');
      return;
    }

    const user = payload.entity as User;
    const data = payload.data as { updatedBy?: string; tenantId?: string };
    const tenantId = data?.tenantId;

    this.logger.log(`📥 Event received: User update for ${user.id}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        // Send notifications to user and admins
        await this.userNotificationService.handleUserUpdated(
          user,
          data?.updatedBy,
        );
        this.logger.log(`✅ Notifications sent for updated user ${user.email}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to send notifications for updated user ${user.email}: ${errorMessage}`,
        );
      }
    });
  }

  /**
   * Handle password reset event - send notifications and confirmation email
   */
  @OnEvent('user.password.reset')
  async handlePasswordReset(payload: EventPayload): Promise<void> {
    if (!payload.entity) {
      this.logger.warn('Password reset event received but entity is null');
      return;
    }

    const user = payload.entity as User;
    const data = payload.data as { type?: string; resetBy?: string; tenantId?: string };
    const type = data?.type;
    const tenantId = data?.tenantId;

    this.logger.log(
      `📥 Event received: Password reset for user ${user.id} with type ${type}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        // Send notifications to user and admins
        try {
          await this.userNotificationService.handlePasswordReset(
            user,
            data?.resetBy,
          );
          this.logger.log(
            `✅ Notifications sent for password reset of user ${user.email}`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to send notifications for password reset: ${errorMessage}`,
          );
        }

        // Send email confirmation if type is 'confirmation'
        if (type === 'confirmation') {
          try {
            await this.userQueue.add(
              'send-password-reset-confirmation',
              {
                userId: user.id,
                tenantId, // Pass tenant context for background job
              },
              {
                delay: 10000,
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 2000,
                },
                removeOnComplete: {
                  count: 100,
                },
                removeOnFail: {
                  age: 259200,
                  count: 100,
                },
                timeout: 30000,
              },
            );
            this.logger.log(
              `✅ Password reset confirmation email queued for ${user.email}`,
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
              `Failed to queue password reset confirmation email: ${errorMessage}`,
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to handle password reset event: ${errorMessage}`,
        );
      }
    });
  }

  /**
   * Handle user deleted event - send notification to admins only
   */
  @OnEvent('user.crud.delete')
  async handleUserDeleted(payload: EventPayload): Promise<void> {
    // Check if this is a user deletion event
    if (!payload.entity) {
      this.logger.warn('User deletion event received but entity is null');
      return;
    }

    const user = payload.entity as User;
    const data = payload.data as { deletedBy?: string; tenantId?: string };
    const tenantId = data?.tenantId;

    this.logger.log(`📥 Event received: User deletion for ${user.id}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        // Send notifications to admins only (user is already deleted)
        await this.userNotificationService.handleUserDeleted(
          user,
          data?.deletedBy,
        );
        this.logger.log(
          `✅ Notifications sent to admins for deleted user ${user.email}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to send notifications for deleted user ${user.email}: ${errorMessage}`,
        );
      }
    });
  }
}

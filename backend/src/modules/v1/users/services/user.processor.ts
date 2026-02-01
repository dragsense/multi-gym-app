import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { UserEmailService } from './user-email.service';
import { UsersService } from '../users.service';
import { RequestContext } from '@/common/context/request-context';

@Processor('user')
export class UserProcessor {
  private readonly logger = new Logger(UserProcessor.name);

  constructor(
    private readonly userEmailService: UserEmailService,
    private readonly usersService: UsersService,
  ) {
    this.logger.log('✅ UserProcessor initialized and listening for jobs');
  }

  /**
   * Handle send welcome email
   */
  @Process('send-welcome-email')
  async handleSendWelcomeEmail(job: Job): Promise<void> {
    const { userId, tempPassword, tenantId } = job.data as {
      userId: string;
      tempPassword: string;
      tenantId?: string;
    };

    this.logger.log(`Processing welcome email for user ${userId}`);

    // Execute within RequestContext.run() to create a new async context
    // This ensures all database operations use the correct tenant database
    await RequestContext.run(async () => {
      // Set tenant context if provided
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const user = await this.usersService.getUser(userId);

        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        await this.userEmailService.sendWelcomeEmail({
          user,
          tempPassword,
        });

        this.logger.log(`Welcome email sent successfully for user ${userId}`);
      } catch (error) {
        this.logger.error(
          `Failed to send welcome email for user ${userId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send password reset confirmation
   */
  @Process('send-password-reset-confirmation')
  async handleSendPasswordResetConfirmation(job: Job): Promise<void> {
    const { userId, tenantId } = job.data;

    this.logger.log(
      `Processing password reset confirmation for user ${userId}`,
    );

    // Execute within RequestContext.run() to create a new async context
    // This ensures all database operations use the correct tenant database
    await RequestContext.run(async () => {
      // Set tenant context if provided
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const user = await this.usersService.getUser(userId);

        const superAdmin = await this.usersService.getSuperAdmin();

        await this.userEmailService.sendPasswordResetConfirmation(
          user,
          superAdmin,
        );

        this.logger.log(
          `Password reset confirmation sent successfully for user ${userId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send password reset confirmation for user ${userId}:`,
          error,
        );
        throw error;
      }
    });
  }
}

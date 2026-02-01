import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SessionEmailService } from '@/modules/v1/sessions/services/session-email.service';
import { SessionsService } from '../sessions.service';
import { UsersService } from '@/modules/v1/users/users.service';
import { ESessionStatus } from '@shared/enums';
import { RequestContext } from '@/common/context/request-context';

@Processor('session')
@Injectable()
export class SessionProcessor {
  private readonly logger = new Logger(SessionProcessor.name);

  constructor(
    private readonly sessionEmailService: SessionEmailService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {
    this.logger.log('✅ SessionProcessor initialized and listening for jobs');
  }

  /**
   * Handle send session confirmation
   */
  @Process('send-session-confirmation')
  async handleSendSessionConfirmation(job: Job): Promise<void> {
    const { sessionId, recipientId, tenantId } = job.data;

    this.logger.log(`Processing session confirmation for session ${sessionId}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const session = await this.sessionsService.getSingle(sessionId);
        if (!session) throw new NotFoundException('Session not found');
        const user = await this.usersService.getUser(recipientId);

        await this.sessionEmailService.sendSessionConfirmation(
          session,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Session confirmation sent successfully for session ${sessionId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send session confirmation for session ${sessionId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send session status update
   */
  @Process('send-session-status-update')
  async handleSendSessionStatusUpdate(job: Job): Promise<void> {
    const { sessionId, recipientId, tenantId } = job.data;

    this.logger.log(
      `Processing session status update for session ${sessionId}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const session = await this.sessionsService.getSingle(sessionId);
        if (!session) throw new NotFoundException('Session not found');
        const user = await this.usersService.getUser(recipientId as string);
        await this.sessionEmailService.sendSessionStatusUpdate(
          session,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Session status update sent successfully for session ${sessionId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send session status update for session ${sessionId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send session deleted
   */
  @Process('send-session-deleted')
  async handleSendSessionDeleted(job: Job): Promise<void> {
    const { sessionId, recipientId, tenantId } = job.data;

    this.logger.log(
      `Processing session deleted notification for session ${sessionId}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const session = await this.sessionsService.getSingle(
          sessionId,
          undefined,
          undefined,
          undefined,
          true,
        );
        if (!session) throw new NotFoundException('Session not found');
        const user = await this.usersService.getUser(recipientId as string);

        await this.sessionEmailService.sendSessionDeleted(
          session,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Session deleted notification sent successfully for session ${sessionId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send session deleted notification for session ${sessionId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send session reminder
   */
  @Process('send-session-reminder')
  async handleSendSessionReminder(job: Job): Promise<void> {
    const { sessionId, recipientId, tenantId } = job.data;

    this.logger.log(`Processing session reminder for session ${sessionId}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const session = await this.sessionsService.getSingle(sessionId);
        if (!session) throw new NotFoundException('Session not found');
        const user = await this.usersService.getUser(recipientId);

        await this.sessionEmailService.sendSessionReminder(
          session,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Session reminder sent successfully for session ${sessionId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send session reminder for session ${sessionId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle mark session passed
   */
  @Process('mark-session-passed')
  async handleMarkSessionPassed(job: Job): Promise<void> {
    const { sessionId, date, tenantId } = job.data as { sessionId: string; date: string; tenantId?: string };

    this.logger.log(`Processing session passed for session ${sessionId}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        await this.sessionsService.createActualSession(
          sessionId + '@' + date,
          ESessionStatus.SCHEDULED,
        );

        this.logger.log(`Session passed successfully for session ${sessionId}`);
      } catch (error) {
        this.logger.error(
          `Failed to mark session passed for session ${sessionId}:`,
          error,
        );
        throw error;
      }
    });
  }
}

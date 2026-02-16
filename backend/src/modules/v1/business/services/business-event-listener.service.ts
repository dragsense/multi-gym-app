import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BusinessService } from '../business.service';
import { Business } from '../entities/business.entity';
import { EventPayload } from '@/common/helper/services/event.service';
import { BusinessEmailService } from './business-email.service';

@Injectable()
export class BusinessEventListenerService implements OnModuleInit {
  private readonly logger = new Logger(BusinessEventListenerService.name);

  constructor(
    private readonly businessService: BusinessService,
    private readonly businessEmailService: BusinessEmailService,
  ) {}

  onModuleInit() {
    this.logger.log('Business event listener initialized');
  }

  /**
   * Handle business created event - send welcome email
   */
  @OnEvent('business.crud.create')
  async handleBusinessCreated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    try {
      const business = await this.businessService.getSingle(payload.entityId, {
        _relations: ['user'],
      });

      if (!business) throw new NotFoundException('Business not found');

      this.logger.log(`Business created: ${business.name} (ID: ${business.id})`);

      if (business.user) {
        const recipientName = `${business.user.firstName || ''} ${business.user.lastName || ''}`.trim() || 'User';
        await this.businessEmailService.sendBusinessCreated(
          business,
          business.user.email,
          recipientName,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle business creation for business ${payload.entityId}:`,
        error,
      );
    }
  }

  /**
   * Handle business deleted event - send deletion email
   */
  @OnEvent('business.crud.delete')
  async handleBusinessDeleted(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    try {
      const business = await this.businessService.getSingle(
        payload.entityId,
        {
          _relations: ['user'],
        },
        true, // include deleted
      );

      if (!business) throw new NotFoundException('Business not found');

      this.logger.log(`Business deleted: ID ${business.id}`);

      if (business.user) {
        const recipientName = `${business.user.firstName || ''} ${business.user.lastName || ''}`.trim() || 'User';
        await this.businessEmailService.sendBusinessDeleted(
          business,
          business.user.email,
          recipientName,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle business deletion for business ${payload.entityId}:`,
        error,
      );
    }
  }

  /**
   * Handle business activated event - send activation email
   */
  @OnEvent('business.activated')
  async handleBusinessActivated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    try {
      const business = await this.businessService.getSingle(payload.entityId, {
        _relations: ['user'],
      });

      if (!business) throw new NotFoundException('Business not found');

      this.logger.log(`Business activated: ${business.name} (ID: ${business.id})`);

      if (business.user) {
        const recipientName = `${business.user.firstName || ''} ${business.user.lastName || ''}`.trim() || 'User';
        await this.businessEmailService.sendBusinessActivated(
          business,
          business.user.email,
          recipientName,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle business activation for business ${payload.entityId}:`,
        error,
      );
    }
  }
}

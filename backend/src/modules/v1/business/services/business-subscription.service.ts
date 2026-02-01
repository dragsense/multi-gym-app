import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { DateTime } from 'luxon';

import { BusinessSubscription } from '../entities/business-subscription.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { IMessageResponse } from '@shared/interfaces';
import { User } from '@/common/base-user/entities/user.entity';
import { BusinessSubscriptionHistoryService } from './business-subscription-history.service';
import { BusinessService } from '../business.service';
import { SubscriptionsService } from '../subscription/subscriptions.service';
import { ESubscriptionStatus, ESubscriptionFrequency, ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { Business } from '../entities/business.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { DatabaseManager } from '@/common/database/database-manager.service';
import { BaseUsersService } from '@/common/base-user/base-users.service';
import { EUserLevels } from '@shared/enums/user.enum';

@Injectable()
export class BusinessSubscriptionService extends CrudService<BusinessSubscription> {
  private readonly customLogger = new LoggerService(BusinessSubscriptionService.name);

  constructor(
    @InjectRepository(BusinessSubscription)
    private readonly businessSubscriptionRepo: Repository<BusinessSubscription>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly businessSubscriptionHistoryService: BusinessSubscriptionHistoryService,
    private readonly baseUsersService: BaseUsersService,
    @Inject(forwardRef(() => BusinessService))
    private readonly businessService: BusinessService,
    private readonly databaseManager: DatabaseManager,
    moduleRef: ModuleRef,
  ) {
    super(businessSubscriptionRepo, moduleRef);
  }

  // overide getRepository to return the businessSubscriptionRepo
  getRepository(): Repository<BusinessSubscription> {
    return this.businessSubscriptionRepo;
  }

  /**
   * Create a business subscription
   * This is called when a business is created or when a subscription is purchased
   */
  async createBusinessSubscription(
    businessId: string,
    subscriptionId: string,
    frequency: ESubscriptionFrequency,
    currentUser: User,
    timezone: string = 'UTC',
  ): Promise<BusinessSubscription> {
    // Fetch business
    const business = await this.businessService.getSingle(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Fetch subscription
    const subscription = await this.subscriptionsService.getSingle(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== ESubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }

    // Check if business has any active subscription
    const activeSubscription = await this.getSingle({
      businessId: business.id,
      isActive: true,
    });

    if (activeSubscription) {
      throw new BadRequestException(
        'Business already has an active subscription. Please cancel or wait for the current subscription to expire before creating a new one.',
      );
    }

    // Find or create business-subscription record
    let businessSubscription = await this.getSingle({
      businessId: business.id,
      subscriptionId: subscription.id,
    });

    if (!businessSubscription) {
      // Calculate start and end dates based on frequency
      const startDate = DateTime.now().setZone(timezone).toJSDate();
      let endDate: Date | undefined;

      // Calculate end date based on frequency
      switch (frequency) {
        case ESubscriptionFrequency.WEEKLY:
          endDate = DateTime.fromJSDate(startDate).setZone(timezone).plus({ weeks: 1 }).toJSDate();
          break;
        case ESubscriptionFrequency.MONTHLY:
          endDate = DateTime.fromJSDate(startDate).setZone(timezone).plus({ months: 1 }).toJSDate();
          break;
        case ESubscriptionFrequency.YEARLY:
          endDate = DateTime.fromJSDate(startDate).setZone(timezone).plus({ years: 1 }).toJSDate();
          break;
        default:
          endDate = undefined;
          break;
      }

      // Create business-subscription record
      businessSubscription = await this.create({
        business: { id: business.id },
        subscription: { id: subscription.id },
        timezone,
        frequency,
      });

      // Create subscription history entry
      const occurredAt = DateTime.now().setZone(timezone).toJSDate();
      this.businessSubscriptionHistoryService.create({
        businessSubscription: { id: businessSubscription.id },
        status: ESubscriptionStatus.ACTIVE,
        source: 'BUSINESS_SUBSCRIPTION_CREATED',
        message: 'Business subscription created',
        metadata: {
          subscriptionId,
          frequency,
          timezone,
        },
        occurredAt,
        startDate,
        endDate: endDate || null,
      }).catch((error: Error) => {
        this.customLogger.error(`Failed to create subscription history: ${error.message}`, error.stack);
      });
    }

    return businessSubscription;
  }

  /**
   * Activate a business subscription
   * Called after successful payment
   */
  async activateBusinessSubscription(
    businessSubscriptionId: string,
    source: string = 'BUSINESS_SUBSCRIPTION_PAYMENT',
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const businessSubscription = await this.getSingle(businessSubscriptionId, {
      _relations: ['business.user', 'subscription'],
    });

    if (!businessSubscription) {
      throw new NotFoundException('Business subscription not found');
    }

    const business = businessSubscription.business;
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Create tenant database if tenantId exists
    if (business.tenantId) {
      await this.databaseManager.createTenantResources(business.tenantId).then(async () => {
        this.customLogger.log(`Tenant database created for business ${business.id}`);

        const user = await this.baseUsersService.getUserByIdWithPassword(business.user.id);

        const userRepository = this.databaseManager.getRepository(User, { tenantId: business.tenantId });
        const newUser = userRepository.create({
          firstName: user?.firstName || business.user.firstName,
          lastName: user?.lastName || business.user.lastName,
          email: user?.email || business.user.email,
          password: user?.password,
          isActive: true,
          isVerified: true,
          level: EUserLevels.ADMIN,
          refUserId: user?.id || business.user.id || null,
        });
        await userRepository.save(newUser);

      }).catch((error: Error) => {
        this.customLogger.error(
          `Failed to create tenant database for business ${business.id}: ${error.message}`,
          error.stack,
        );
      });
    }

    // Deactivate all other subscriptions for this business
    const repository = this.getRepository();
    await repository.update(
      {
        businessId: businessSubscription?.businessId,
        id: Not(businessSubscriptionId),
      },
      {
        isActive: false,
      },
    ).catch((error: Error) => {
      this.customLogger.error(
        `Failed to deactivate other subscriptions: ${error.message}`,
        error.stack,
      );
    });

    // Activate this subscription
    await repository.update(
      { id: businessSubscriptionId },
      { isActive: true },
    );

    // Get latest history to get start/end dates
    const latestHistory = await this.businessSubscriptionHistoryService.getLatestBusinessSubscriptionHistory(
      businessSubscriptionId,
    );

    const startDate = latestHistory?.startDate || DateTime.now().toJSDate();
    const endDate = latestHistory?.endDate;

    // Create history entry for activation
    const occurredAt = DateTime.now().toJSDate();
    await this.businessSubscriptionHistoryService.create({
      businessSubscription: { id: businessSubscriptionId },
      status: ESubscriptionStatus.ACTIVE,
      source,
      message: 'Business subscription activated',
      metadata: metadata || {},
      occurredAt,
      startDate,
      endDate: endDate || null,
    }).catch((error: Error) => {
      this.customLogger.error(`Failed to create subscription history: ${error.message}`, error.stack);
    });

    // Emit business activated event
    this.businessService.emitEvent('activated', business, undefined, {
      businessSubscriptionId,
      source,
      metadata,
    });
  }

  /**
   * Get subscription status for a business subscription
   */
  async getBusinessSubscriptionStatus(
    businessSubscriptionId: string,
  ): Promise<{ status: ESubscriptionStatus | null; activatedAt: Date | null }> {
    return this.businessSubscriptionHistoryService.getSubscriptionStatus(businessSubscriptionId);
  }

  /**
   * Get current active subscription for a business
   */
  async getCurrentBusinessSubscription(businessId: string): Promise<BusinessSubscription | null> {
    return this.getSingle({
      businessId: businessId,
      isActive: true,
    }, {
      _relations: ['subscription', 'business'],
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
  }

  async getBusinessSubscriptionStatusByBusinessId(businessId: string): Promise<{
    status: ESubscriptionStatus | null;
    activatedAt?: Date | null;
    subdomain?: string | null;
  }> {

    const business = await this.businessService.getSingle({ id: businessId });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const businessSubscription = await this.getCurrentBusinessSubscription(businessId);
    if (!businessSubscription) {
      return {
        status: ESubscriptionStatus.INACTIVE,
        activatedAt: null,
        subdomain: business.subdomain,
      };
    }
    const status = await this.businessSubscriptionHistoryService.getSubscriptionStatus(businessSubscription.id);
    return {
      status: status.status,
      activatedAt: status.activatedAt,
      subdomain: business.subdomain,
    };
  }

  async getUserBusinessSubscriptionStatus(currentUser: User): Promise<{
    status: ESubscriptionStatus | null;
    activatedAt?: Date | null;
    subdomain?: string | null;
  }> {
    const business = await this.businessService.getMyBusiness(currentUser);

    const businessSubscription = await this.getCurrentBusinessSubscription(business.id);
    if (!businessSubscription) {
      return {
        status: ESubscriptionStatus.INACTIVE,
        activatedAt: null,
        subdomain: business.subdomain,
      };
    }
    const status = await this.businessSubscriptionHistoryService.getSubscriptionStatus(businessSubscription.id);
    return {
      status: status.status,
      activatedAt: status.activatedAt,
      subdomain: business.subdomain,
    };
  }

  /**
   * Get current subscription summary for the logged-in user's business
   * Returns full subscription information including name, price, color, etc.
   */
  async getMyBusinessSubscriptionSummary(currentUser: User): Promise<{
    status: ESubscriptionStatus | null;
    startDate?: Date | null;
    endDate?: Date | null;
    subscriptionName?: string | null;
    subscriptionDescription?: string | null;
    frequency?: ESubscriptionFrequency | null;
    price?: number | null;
    color?: string | null;
    activatedAt?: Date | null;
  }> {
    const business = await this.businessService.getMyBusiness(currentUser);

    const businessSubscription = await this.getCurrentBusinessSubscription(business.id);
    if (!businessSubscription) {
      return {
        status: ESubscriptionStatus.INACTIVE,
        startDate: null,
        endDate: null,
        subscriptionName: null,
        subscriptionDescription: null,
        frequency: null,
        price: null,
        color: null,
        activatedAt: null,
      };
    }

    // Subscription details are already loaded via relations in getCurrentBusinessSubscription
    const subscription = businessSubscription.subscription;

    // Get latest history for status, dates, and activatedAt
    const latestHistory = await this.businessSubscriptionHistoryService.getLatestBusinessSubscriptionHistory(businessSubscription.id);

    let activatedAt: Date | null = null;
    if (latestHistory?.status === ESubscriptionStatus.ACTIVE) {
      activatedAt = latestHistory.occurredAt ?? latestHistory.createdAt;
    }

    return {
      status: latestHistory?.status || ESubscriptionStatus.INACTIVE,
      startDate: latestHistory?.startDate || null,
      endDate: latestHistory?.endDate || null,
      subscriptionName: subscription?.title || null,
      subscriptionDescription: subscription?.description || null,
      frequency: (latestHistory?.metadata?.frequency as ESubscriptionFrequency) || subscription?.frequency?.[0] || null,
      price: subscription?.price ? Number(subscription.price) : null,
      color: subscription?.color || null,
      activatedAt,
    };
  }

  /**
   * Get features/modules available for a business based on their active subscription
   * @param businessId - The business ID to check features for
   * @returns Array of features available for the business, or empty array if no active subscription
   */
  async getBusinessFeatures(businessId: string): Promise<ESubscriptionFeatures[]> {
    const businessSubscription = await this.getCurrentBusinessSubscription(businessId);
    
    if (!businessSubscription || !businessSubscription.isActive) {
      return [];
    }

    // Check if subscription is active (not expired)
    const status = await this.businessSubscriptionHistoryService.getSubscriptionStatus(businessSubscription.id);
    if (status.status !== ESubscriptionStatus.ACTIVE) {
      return [];
    }

    return businessSubscription.subscription?.features || [];
  }

  /**
   * Check if a business has access to specific module(s)
   * @param businessId - The business ID to check
   * @param requiredModules - Array of modules to check access for
   * @returns true if business has access to ALL required modules
   */
  async hasModuleAccess(businessId: string, requiredModules: ESubscriptionFeatures[]): Promise<boolean> {
    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const businessFeatures = await this.getBusinessFeatures(businessId);
    
    // Check if business has ALL required modules
    return requiredModules.every(module => businessFeatures.includes(module));
  }

  /**
   * Get missing modules that a business doesn't have access to
   * @param businessId - The business ID to check
   * @param requiredModules - Array of modules to check
   * @returns Array of modules the business doesn't have access to
   */
  async getMissingModules(businessId: string, requiredModules: ESubscriptionFeatures[]): Promise<ESubscriptionFeatures[]> {
    if (!requiredModules || requiredModules.length === 0) {
      return [];
    }

    const businessFeatures = await this.getBusinessFeatures(businessId);
    
    return requiredModules.filter(module => !businessFeatures.includes(module));
  }
}

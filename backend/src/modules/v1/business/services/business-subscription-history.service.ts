import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { BusinessSubscriptionHistory } from '../entities/business-subscription-history.entity';
import { ESubscriptionStatus } from '@shared/enums/business/subscription.enum';
import { CrudService } from '@/common/crud/crud.service';

@Injectable()
export class BusinessSubscriptionHistoryService extends CrudService<BusinessSubscriptionHistory> {
  constructor(
    @InjectRepository(BusinessSubscriptionHistory)
    private readonly businessSubscriptionHistoryRepo: Repository<BusinessSubscriptionHistory>,
    moduleRef: ModuleRef,
  ) {
    super(businessSubscriptionHistoryRepo, moduleRef);
  }


  // overide getRepository to return the businessSubscriptionHistoryRepo
  getRepository(): Repository<BusinessSubscriptionHistory> {
    return this.businessSubscriptionHistoryRepo;
  }

  /**
   * Get the current subscription status by looking at the latest history entry
   */
  async getLatestBusinessSubscriptionHistory(
    businessSubscriptionId: string,
  ): Promise<BusinessSubscriptionHistory | null> {
    const repository = this.getRepository();
    return repository.findOne({
      where: { businessSubscription: { id: businessSubscriptionId } },
      order: { createdAt: 'DESC' },
      
    });
  }

  /**
   * Get the current subscription status by looking at the latest history entry
   */
  async getSubscriptionStatus(
    businessSubscriptionId: string,
  ): Promise<{ status: ESubscriptionStatus | null; activatedAt: Date | null }> {
    const lastHistory = await this.getLatestBusinessSubscriptionHistory(businessSubscriptionId);

    if (!lastHistory) {
      return { status: null, activatedAt: null };
    }

    let activatedAt: Date | null = null;
    if (lastHistory.status === ESubscriptionStatus.ACTIVE) {
      activatedAt = lastHistory.occurredAt ?? lastHistory.createdAt;
    }

    return {
      status: lastHistory.status,
      activatedAt,
    };
  }

  /**
   * Get all subscription history for a business by businessId
   * Aggregates histories from all subscriptions of the business
   * @deprecated Use get method with beforeQuery callback instead for pagination support
   */
  async getHistoryByBusinessId(businessId: string): Promise<BusinessSubscriptionHistory[]> {
    const repository = this.getRepository();
    return repository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.businessSubscription', 'businessSubscription')
      .leftJoinAndSelect('businessSubscription.subscription', 'subscription')
      .leftJoinAndSelect('businessSubscription.business', 'business')
      .where('businessSubscription.businessId = :businessId', { businessId })
      .andWhere('history.deletedAt IS NULL')
      .orderBy('history.createdAt', 'DESC')
      .getMany();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { BillingHistory } from '../entities/billing-history.entity';
import { EBillingStatus } from '@shared/enums/billing.enum';
import { CrudService } from '@/common/crud/crud.service';

export interface AddHistoryEntryParams {
  billingId: string;
  status: EBillingStatus;
  source: string;
  message?: string;
  metadata?: Record<string, unknown>;
  attemptedAt?: Date | null;
}

@Injectable()
export class BillingHistoryService extends CrudService<BillingHistory> {
  constructor(
    @InjectRepository(BillingHistory)
    private readonly billingHistoryRepo: Repository<BillingHistory>,
    moduleRef: ModuleRef,
  ) {
    super(billingHistoryRepo, moduleRef);
  }


  getLatestBillingHistoryQuery() {
    const repository = this.getRepository();
    return repository
      .createQueryBuilder('bh')
      .innerJoinAndSelect('bh.billing', 'billing')
      .where(qb => {
        const sub = qb.subQuery()
          .select('MAX(bh2."createdAt")')
          .from('billing_history', 'bh2')
          .where('bh2."billingId" = bh."billingId"')
          .getQuery();

        return `bh."createdAt" = ${sub}`;
      });
  }
}

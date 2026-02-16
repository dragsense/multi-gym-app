import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { MemberMembershipHistory } from '../entities/member-membership-history.entity';
import { EMembershipStatus } from '@shared/enums/membership.enum';
import { CrudService } from '@/common/crud/crud.service';
import { MemberMembershipStatusDto } from '@shared/dtos';


@Injectable()
export class MemberMembershipHistoryService extends CrudService<MemberMembershipHistory> {
  constructor(
    @InjectRepository(MemberMembershipHistory)
    private readonly memberMembershipHistoryRepo: Repository<MemberMembershipHistory>,
    moduleRef: ModuleRef,
  ) {
    super(memberMembershipHistoryRepo, moduleRef);
  }

  /**
   * Get the current membership status by looking at the latest history entry
   */
  async getLatestMemberMembershipHistory(
    memberMembershipId: string,
  ): Promise<MemberMembershipHistory | null> {
    const repository = this.getRepository();
    return repository.findOne({
      where: { memberMembership: { id: memberMembershipId } },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get the current membership status by looking at the latest history entry
   */
  async getMembershipStatus(
    memberMembershipId: string,
  ): Promise<MemberMembershipStatusDto> {
    const lastHistory = await this.getLatestMemberMembershipHistory(memberMembershipId);

    if (!lastHistory) {
      return { status: null, activatedAt: null };
    }

    let activatedAt: Date | null = null;
    if (lastHistory.status === EMembershipStatus.ACTIVE) {
      activatedAt = lastHistory.occurredAt ?? lastHistory.createdAt;
    }

    return {
      status: lastHistory.status,
      activatedAt,
    };
  }

  /**
   * Get all membership history for a member by memberId
   * Aggregates histories from all memberships of the member
   * @deprecated Use get method with beforeQuery callback instead for pagination support
   */
  async getHistoryByMemberId(memberId: string): Promise<MemberMembershipHistory[]> {
    const repository = this.getRepository();
    return repository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.memberMembership', 'memberMembership')
      .leftJoinAndSelect('memberMembership.membership', 'membership')
      .leftJoinAndSelect('memberMembership.member', 'member')
      .where('memberMembership.memberId = :memberId', { memberId })
      .andWhere('history.deletedAt IS NULL')
      .orderBy('history.createdAt', 'DESC')
      .getMany();
  }
}


import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { DateTime } from 'luxon';

import { MemberMembership } from '../entities/member-membership.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { BillingsService } from '@/modules/v1/billings/billings.service';
import { MemberMembershipHistoryService } from './member-membership-history.service';
import { MembersService } from '@/modules/v1/members/members.service';
import { MembershipsService } from '../memberships.service';
import { EventService } from '@/common/helper/services/event.service';
import { EMembershipExpiry, EMembershipStatus } from '@shared/enums/membership.enum';
import { CurrentMembershipSummaryDto, MemberMembershipStatusDto, AdminAssignMembershipDto } from '@shared/dtos';
import { IMessageResponse } from '@shared/interfaces/api/response.interface';
import { RequestContext } from '@/common/context/request-context';

@Injectable()
export class MemberMembershipService extends CrudService<MemberMembership> {
  private readonly customLogger = new LoggerService(MemberMembershipService.name);

  constructor(
    @InjectRepository(MemberMembership)
    private readonly memberMembershipRepo: Repository<MemberMembership>,
    private readonly membershipsService: MembershipsService,
    private readonly memberMembershipHistoryService: MemberMembershipHistoryService,
    private readonly membersService: MembersService,
    private readonly membershipEventService: EventService,
    moduleRef: ModuleRef,
  ) {
    super(memberMembershipRepo, moduleRef);
  }

  async createMemberMembership(
    membershipId: string,
    memberId: string,
    timezone: string,
    startDate?: string
  ): Promise<{ memberMembership: MemberMembership; isNew: boolean }> {
    // Fetch membership
    const membership = await this.membershipsService.getSingle(membershipId);
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (!membership.enabled) {
      throw new BadRequestException('Membership is not enabled');
    }


    // Check if member has any active membership
    const activeMembership = await this.getSingle({
      memberId: memberId,
      isActive: true,
    });

    if (activeMembership) {
      throw new BadRequestException(
        'Member already has an active membership. Please cancel or wait for the current membership to expire before creating a new one.',
      );
    }

    // Find or create member-membership record
    let memberMembership = await this.getSingle({
      memberId: memberId,
      membershipId: membership.id,
    });

    let isNew = false;

    if (!memberMembership) {
      // Calculate start and end dates based on expiry enum
      const startDate = DateTime.now().setZone(timezone).toJSDate();
      let endDate: Date | undefined;

      if (membership.expiry) {
        let duration: { months?: number } | undefined;

        switch (membership.expiry) {
          case EMembershipExpiry.AFTER_1_MONTH:
            duration = { months: 1 };
            break;
          case EMembershipExpiry.AFTER_3_MONTHS:
            duration = { months: 3 };
            break;
          case EMembershipExpiry.AFTER_6_MONTHS:
            duration = { months: 6 };
            break;
          case EMembershipExpiry.AFTER_1_YEAR:
            duration = { months: 12 };
            break;
          case EMembershipExpiry.AFTER_2_YEARS:
            duration = { months: 24 };
            break;
          case EMembershipExpiry.NEVER:
            duration = undefined;
            break;
          default:
            duration = undefined;
            break;
        }

        if (duration?.months) {
          endDate = DateTime.fromJSDate(startDate)
            .setZone(timezone)
            .plus(duration)
            .toJSDate();
        }
      }

      // Create member-membership record
      memberMembership = await this.create({
        member: { id: memberId },
        membership: { id: membership.id },
        timezone,
        startDate
      });

      isNew = true;

      // Create membership history entry
      const occurredAt = DateTime.now().setZone(timezone).toJSDate();
      this.memberMembershipHistoryService.create({
        memberMembership: { id: memberMembership.id },
        status: EMembershipStatus.ACTIVE,
        source: 'MEMBERSHIP_CREATED',
        message: 'Member membership created',
        metadata: {
          membershipId,
          timezone,
        },
        occurredAt,
        startDate,
        endDate: endDate || null,
      }).catch((error: Error) => {
        this.customLogger.error(`Failed to create membership history: ${error.message}`, error.stack);
      });
    }

    return { memberMembership, isNew };
  }

  /**
   * Activate a member membership
   * Called after successful payment or scheduled activation
   */
  async activateMemberMembership(
    memberMembershipId: string,
    source: string = 'MEMBERSHIP_PAYMENT',
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const memberMembership = await this.getSingle(memberMembershipId, {
      _relations: ['member', 'membership'],
    });

    if (!memberMembership) {
      throw new NotFoundException('Member membership not found');
    }

    // Deactivate all other memberships for this member
    const repository = this.getRepository();
    await repository.update(
      {
        memberId: memberMembership.memberId,
        id: Not(memberMembershipId),
      },
      {
        isActive: false,
      },
    ).catch((error: Error) => {
      this.customLogger.error(
        `Failed to deactivate other memberships: ${error.message}`,
        error.stack,
      );
    });

    // Activate this membership
    await repository.update(
      { id: memberMembershipId },
      { isActive: true },
    );

    // Get latest history to get start/end dates
    const latestHistory = await this.memberMembershipHistoryService.getLatestMemberMembershipHistory(
      memberMembershipId,
    );

    const startDate = latestHistory?.startDate || DateTime.now().toJSDate();
    const endDate = latestHistory?.endDate;

    // Create history entry for activation
    const occurredAt = DateTime.now().toJSDate();
    await this.memberMembershipHistoryService.create({
      memberMembership: { id: memberMembershipId },
      status: EMembershipStatus.ACTIVE,
      source,
      message: 'Member membership activated',
      metadata: metadata || {},
      occurredAt,
      startDate,
      endDate: endDate || null,
    }).catch((error: Error) => {
      this.customLogger.error(`Failed to create membership history: ${error.message}`, error.stack);
    });

    // Emit activation event to trigger billing schedule
    // Include tenantId for multi-tenant database routing when schedule executes
    const tenantId = RequestContext.get<string>('tenantId');
    this.membershipEventService.emit('membermembership.activated', {
      entity: memberMembership,
      entityId: memberMembershipId,
      operation: 'activate',
      source: 'member-membership.service',
      tableName: 'member_memberships',
      timestamp: new Date(),
      data: {
        memberId: memberMembership.memberId,
        membershipId: memberMembership.membershipId,
        startDate,
        endDate,
        activationSource: source,
        tenantId, // Pass tenant context for schedule creation
      },
    });
  }

  async getMemberMembershipStatus(
    id: string
  ): Promise<MemberMembershipStatusDto> {
    const lastHistory = await this.memberMembershipHistoryService.getLatestMemberMembershipHistory(id);

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

  async getCurrentMembershipSummary(memberId: string): Promise<CurrentMembershipSummaryDto> {
    // Find active membership for member
    const repository = this.getRepository();
    const activeMembership = await repository.findOne({
      where: {
        memberId: memberId,
        isActive: true,
      },
      relations: ['membership'],
    });

    if (!activeMembership) {
      return {
        status: null,
        startDate: null,
        endDate: null,
        membershipName: null,
        membershipDescription: null,
        billingFrequency: null,
        price: null,
        pricePeriod: null,
        color: null,
      };
    }

    // Get latest history for this membership
    const latestHistory = await this.memberMembershipHistoryService.getLatestMemberMembershipHistory(
      activeMembership.id,
    );

    if (!latestHistory) {
      return {
        status: null,
        startDate: null,
        endDate: null,
        membershipName: activeMembership.membership?.title || null,
        membershipDescription: activeMembership.membership?.description || null,
        billingFrequency: activeMembership.membership?.billingFrequency || null,
        price: activeMembership.membership?.price ? Number(activeMembership.membership.price) : null,
        pricePeriod: activeMembership.membership?.pricePeriod || null,
        color: activeMembership.membership?.color || null,
      };
    }

    return {
      status: latestHistory.status,
      startDate: latestHistory.startDate,
      endDate: latestHistory.endDate || null,
      membershipName: activeMembership.membership?.title || null,
      membershipDescription: activeMembership.membership?.description || null,
      billingFrequency: activeMembership.membership?.billingFrequency || null,
      price: activeMembership.membership?.price ? Number(activeMembership.membership.price) : null,
      pricePeriod: activeMembership.membership?.pricePeriod || null,
      color: activeMembership.membership?.color || null,
    };
  }

  /**
   * Get current membership summary for the current user
   * First finds the member by userId, then gets the membership summary
   */
  async getMyMembershipSummary(userId: string): Promise<CurrentMembershipSummaryDto> {
    // Find member by userId
    const member = await this.membersService.getSingle({ userId });

    if (!member) {
      return {
        status: null,
        startDate: null,
        endDate: null,
        membershipName: null,
        membershipDescription: null,
        billingFrequency: null,
        price: null,
        pricePeriod: null,
        color: null,
      };
    }

    return this.getCurrentMembershipSummary(member.id);
  }

  /**
   * Cancel the current user's active membership
   */
  async cancelMyMembership(userId: string): Promise<{ message: string }> {
    // Find member by userId
    const member = await this.membersService.getSingle({ userId });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Find active membership for member using getSingle
    const activeMemberMembership = await this.getSingle(
      { memberId: member.id, isActive: true },
      { _relations: ['membership'] },
    );

    if (!activeMemberMembership) {
      throw new BadRequestException('No active membership found to cancel');
    }

    // Deactivate the membership
    await this.update(activeMemberMembership.id, { isActive: false });

    // Emit event to cancel billing schedules
    // Include tenantId for multi-tenant database routing
    const tenantIdForCancel = RequestContext.get<string>('tenantId');
    this.membershipEventService.emit('membermembership.cancelled', {
      entity: activeMemberMembership,
      entityId: activeMemberMembership.id,
      operation: 'cancel',
      source: 'member-membership.service',
      tableName: 'member_memberships',
      timestamp: new Date(),
      data: {
        memberId: member.id,
        membershipId: activeMemberMembership.membershipId,
        membershipTitle: activeMemberMembership.membership?.title,
        tenantId: tenantIdForCancel, // Pass tenant context
      },
    });

    // Create history entry for cancellation
    const occurredAt = DateTime.now().toJSDate();
    await this.memberMembershipHistoryService.create({
      memberMembership: { id: activeMemberMembership.id },
      status: EMembershipStatus.CANCELLED,
      source: 'MEMBER_CANCELLED',
      message: 'Membership cancelled by member',
      metadata: {
        cancelledAt: occurredAt,
        membershipId: activeMemberMembership.membershipId,
        membershipTitle: activeMemberMembership.membership?.title,
      },
      occurredAt,
      startDate: null,
      endDate: null,
    }).catch((error: Error) => {
      this.customLogger.error(`Failed to create cancellation history: ${error.message}`, error.stack);
    });

    return { message: 'Membership cancelled successfully' };
  }

  /**
   * Cancel a member's active membership by memberId (Admin use)
   */
  async cancelMemberMembership(memberId: string): Promise<{ message: string }> {
    // Find active membership for member using getSingle
    const activeMemberMembership = await this.getSingle(
      { memberId, isActive: true },
      { _relations: ['membership'] },
    );

    if (!activeMemberMembership) {
      throw new BadRequestException('No active membership found to cancel');
    }

    // Deactivate the membership
    await this.update(activeMemberMembership.id, { isActive: false });

    // Emit event to cancel billing schedules
    // Include tenantId for multi-tenant database routing
    const tenantIdForAdminCancel = RequestContext.get<string>('tenantId');
    this.membershipEventService.emit('membermembership.cancelled', {
      entity: activeMemberMembership,
      entityId: activeMemberMembership.id,
      operation: 'cancel',
      source: 'member-membership.service',
      tableName: 'member_memberships',
      timestamp: new Date(),
      data: {
        memberId,
        membershipId: activeMemberMembership.membershipId,
        membershipTitle: activeMemberMembership.membership?.title,
        tenantId: tenantIdForAdminCancel, // Pass tenant context
      },
    });

    // Create history entry for cancellation
    const occurredAt = DateTime.now().toJSDate();
    await this.memberMembershipHistoryService.create({
      memberMembership: { id: activeMemberMembership.id },
      status: EMembershipStatus.CANCELLED,
      source: 'ADMIN_CANCELLED',
      message: 'Membership cancelled by admin',
      metadata: {
        cancelledAt: occurredAt,
        membershipId: activeMemberMembership.membershipId,
        membershipTitle: activeMemberMembership.membership?.title,
      },
      occurredAt,
      startDate: null,
      endDate: null,
    }).catch((error: Error) => {
      this.customLogger.error(`Failed to create cancellation history: ${error.message}`, error.stack);
    });

    return { message: 'Membership cancelled successfully' };
  }

  /**
   * Admin assigns membership to a member with a specific start date
   * This creates the membership and schedules billing from the start date
   */
  async adminAssignMembership(
    dto: AdminAssignMembershipDto,
    timezone: string
  ): Promise<IMessageResponse> {

    const { memberId, membershipId, startDate, paymentPreference } = dto;

    const parsedStartDate = DateTime.fromISO(startDate).setZone(timezone);

    const { memberMembership, isNew } = await this.createMemberMembership(membershipId, memberId, timezone, parsedStartDate.toISO()!);

    // Create membership history entry
    const occurredAt = DateTime.now().setZone(timezone).toJSDate();
    await this.memberMembershipHistoryService.create({
      memberMembership: { id: memberMembership.id },
      status: EMembershipStatus.SCHEDULED,
      source: 'ADMIN_ASSIGNED',
      message: `Membership assigned by admin, scheduled to start on ${parsedStartDate.toFormat('yyyy-MM-dd')}`,
      metadata: {
        memberMembershipId: memberMembership.id,
        isNew,
        timezone,
        assignedStartDate: startDate,
      },
      occurredAt,
      startDate: parsedStartDate.toJSDate(),
    }).catch((error: Error) => {
      this.customLogger.error(`Failed to create membership history: ${error.message}`, error.stack);
    });

    // Emit event to trigger activation schedule and billing schedule creation
    // Include tenantId in event data for multi-tenant database routing when schedule executes
    const tenantId = RequestContext.get<string>('tenantId');
    this.membershipEventService.emit('membermembership.admin.assigned', {
      entity: memberMembership,
      entityId: memberMembership.id,
      operation: 'create',
      source: 'member-membership.service',
      tableName: 'member_memberships',
      timestamp: new Date(),
      data: {
        timezone,
        isNew,
        paymentPreference,
        tenantId, // Pass tenant context for schedule creation
      },
    });

    return {
      message: `Membership assigned successfully. Will be activated on ${parsedStartDate.toFormat('yyyy-MM-dd')}.`
    };
  }
}


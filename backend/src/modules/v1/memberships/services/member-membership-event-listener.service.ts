import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ScheduleService } from '@/common/schedule/schedule.service';
import { EventPayload } from '@/common/helper/services/event.service';
import {
  EScheduleFrequency,
  EScheduleStatus,
} from '@shared/enums/schedule.enum';
import { MemberMembershipService } from './member-membership.service';
import { MemberMembershipHistoryService } from './member-membership-history.service';
import { MemberMembership } from '../entities/member-membership.entity';
import { ActionRegistryService } from '@/common/helper/services/action-registry.service';
import { MemberMembershipBillingService } from './member-membership-billing.service';
import { MembersService } from '@/modules/v1/members/members.service';
import { DateTime } from 'luxon';
import { EBillingFrequency, EMembershipExpiry, EMembershipStatus, EPaymentPreference } from '@shared/enums/membership.enum';
import { EBillingStatus } from '@shared/enums/billing.enum';
import { BillingsService } from '@/modules/v1/billings/billings.service';
import { PaymentAdapterCardsService } from '@/modules/v1/payment-adapter/services/payment-adapter-cards.service';
import { EBillingType } from '@shared/enums/billing.enum';
import { MemberMembershipBilling } from '../entities/member-membership-billing.entity';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { User } from '@/common/base-user/entities/user.entity';
import { RequestContext } from '@/common/context/request-context';
import { MembershipNotificationService } from './membership-notification.service';

@Injectable()
export class MemberMembershipEventListenerService implements OnModuleInit {
  private readonly logger = new Logger(MemberMembershipEventListenerService.name);

  constructor(
    private readonly memberMembershipService: MemberMembershipService,
    private readonly memberMembershipHistoryService: MemberMembershipHistoryService,
    private readonly scheduleService: ScheduleService,
    private readonly actionRegistryService: ActionRegistryService,
    private readonly memberMembershipBillingService: MemberMembershipBillingService,
    private readonly membersService: MembersService,
    private readonly billingsService: BillingsService,
    private readonly paymentAdapterCardsService: PaymentAdapterCardsService,
    private readonly entityRouterService: EntityRouterService,
    private readonly membershipNotificationService: MembershipNotificationService,
  ) { }

  onModuleInit() {
    // Register membership billing action with action registry
    this.actionRegistryService.registerAction('process-membership-billing', {
      handler: this.handleProcessMembershipBilling.bind(this),
      description: 'Process recurring membership billing',
      retryable: true,
      timeout: 30000,
    });

    // Register annual fee billing action with action registry
    this.actionRegistryService.registerAction('process-annual-fee-billing', {
      handler: this.handleProcessAnnualFeeBilling.bind(this),
      description: 'Process annual fee billing',
      retryable: true,
      timeout: 30000,
    });

    // Register membership activation action with action registry
    this.actionRegistryService.registerAction('activate-member-membership', {
      handler: this.handleActivateMemberMembership.bind(this),
      description: 'Activate scheduled member membership',
      retryable: true,
      timeout: 30000,
    });
  }

  /**
   * Handle memberMembership cancelled event - cancel billing schedules
   */
  @OnEvent('membermembership.cancelled')
  async handleMemberMembershipCancelled(payload: EventPayload): Promise<void> {
    if (!payload.entityId) return;

    // Get tenantId from event payload data
    const tenantId = (payload.data as any)?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        this.logger.log(
          `Member membership cancelled: ${payload.entityId}, stopping billing schedules`,
        );

        const memberMembership = await this.memberMembershipService.getSingle(
          payload.entityId,
          {
            _relations: ['member', 'member.user', 'membership'],
          },
        );

        if (memberMembership) {
          await this.membershipNotificationService.notifyAdminsMembershipCancelled(
            memberMembership,
            (payload.data as any)?.cancelledBy,
          );
        }

        await this.cancelMemberMembershipSchedules(payload.entityId);
      } catch (error) {
        this.logger.error(
          `Failed to handle member membership cancellation for ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Cancel all active billing schedules for a member membership
   */
  private async cancelMemberMembershipSchedules(memberMembershipId: string): Promise<void> {
    try {
      // Find all active schedules for this member membership
      const schedules = await this.scheduleService.getAll(
        {},
        undefined,
        {
          beforeQuery: (query) => {
            query
              .andWhere('entity.entityId = :entityId', { entityId: memberMembershipId })
              .andWhere('entity.status = :status', { status: EScheduleStatus.ACTIVE })
              .andWhere('entity.action IN (:...actions)', {
                actions: ['process-membership-billing', 'process-annual-fee-billing']
              });
            return query;
          },
        },
      );

      // Mark each schedule as completed (effectively cancelling it)
      for (const schedule of schedules) {
        await this.scheduleService.update(schedule.id, {
          status: EScheduleStatus.CANCELLED,
        });
        this.logger.log(`Cancelled billing schedule ${schedule.id} for member membership ${memberMembershipId}`);
      }

      if (schedules.length > 0) {
        this.logger.log(`Cancelled ${schedules.length} billing schedule(s) for member membership ${memberMembershipId}`);
      } else {
        this.logger.log(`No active billing schedules found for member membership ${memberMembershipId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to cancel billing schedules for member membership ${memberMembershipId}:`,
        error,
      );
    }
  }

  /**
   * Handle memberMembership activated event - setup recurring billing schedule
   * This is triggered when membership is activated (after payment)
   * Note: For scheduled activations (admin-assigned), billing is handled in handleActivateMemberMembership
   */
  @OnEvent('membermembership.activated')
  async handleMemberMembershipActivated(payload: EventPayload): Promise<void> {
    if (!payload.entityId) return;

    // Skip if this is a scheduled activation - billing is handled in the action handler
    const activationSource = (payload.data as any)?.activationSource;
    if (activationSource === 'SCHEDULED_ACTIVATION') {
      this.logger.log(
        `Skipping billing schedule for ${payload.entityId} - already handled by scheduled activation`,
      );
      return;
    }

    // Get tenantId from event payload data (passed from service that emitted the event)
    const tenantId = (payload.data as any)?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const memberMembership = await this.memberMembershipService.getSingle(
          payload.entityId,
          {
            _relations: ['member', 'member.user', 'membership'],
          },
        );
        if (!memberMembership) throw new NotFoundException('Member membership not found');

        this.logger.log(
          `Member membership activated: ${memberMembership.id} for member ${memberMembership.memberId}`,
        );

        // Only schedule billing if membership has billing frequency
        if (!memberMembership.membership?.billingFrequency) {
          this.logger.log(
            `Membership ${memberMembership.membershipId} has no billing frequency, skipping billing schedule`,
          );
          return;
        }

        // Send notifications
        await Promise.all([
          this.membershipNotificationService.notifyAdminsMembershipActivated(
            memberMembership,
            (payload.data as any)?.activatedBy || (payload.data as any)?.createdBy,
          ),
          this.membershipNotificationService.notifyMemberMembershipActivated(
            memberMembership,
          ),
          // Schedule recurring billing with tenant context
          this.scheduleMembershipBilling(memberMembership, tenantId),
        ]);
      } catch (error) {
        this.logger.error(
          `Failed to handle member membership activation for ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Handle admin assigned membership event - only schedule activation
   * Billing schedules are created when activation runs on the start date
   */
  @OnEvent('membermembership.admin.assigned')
  async handleAdminAssignedMembership(payload: EventPayload): Promise<void> {
    if (!payload.entityId || !payload.data) return;

    // Get tenantId from event payload data (passed from service that emitted the event)
    const { isNew, timezone, paymentPreference, tenantId } = payload.data as {
      isNew: boolean;
      timezone: string;
      paymentPreference: EPaymentPreference;
      tenantId?: string;
    };

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const memberMembership = await this.memberMembershipService.getSingle(
          payload.entityId,
          {
            _relations: ['member', 'member.user', 'membership'],
          },
        );
        if (!memberMembership) throw new NotFoundException('Member membership not found');

        this.logger.log(
          `Admin assigned membership: ${memberMembership.id} for member ${memberMembership.memberId}`,
        );

        // Schedule activation on the start date with tenant context
        // The activation handler will create initial billing and schedule recurring billing
        await this.scheduleActivation(memberMembership, timezone, isNew, paymentPreference, tenantId);
      } catch (error) {
        this.logger.error(
          `Failed to handle admin assigned membership for ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Schedule membership activation for a specific date
   * @param tenantId - Tenant ID for multi-tenant database routing (passed from event payload)
   */
  private async scheduleActivation(
    memberMembership: MemberMembership,
    timezone: string,
    isNew: boolean,
    paymentPreference: EPaymentPreference,
    tenantId?: string,
  ): Promise<void> {
    try {
      const startDate = memberMembership.startDate || DateTime.now().setZone(timezone).toJSDate();

      const activationDate = DateTime.fromJSDate(startDate).setZone(timezone);

      // Create one-time schedule for activation
      await this.scheduleService.createSchedule({
        title: `Activate Membership - ${memberMembership.membership?.title || 'Membership'}`,
        description: `Activate scheduled membership for member`,
        action: 'activate-member-membership',
        entityId: memberMembership.id,
        frequency: EScheduleFrequency.ONCE,
        startDate: activationDate.toJSDate().toISOString(),
        timeOfDay: '00:00',
        timezone: timezone,
        retryOnFailure: true,
        tenantId, // Include tenant context for multi-tenant database routing
        data: {
          memberMembershipId: memberMembership.id,
          currentUser: memberMembership.member.user,
          timezone,
          isNew,
          paymentPreference,
          tenantId, // Also store in data for action handlers
        },
      });

      this.logger.log(
        `Scheduled activation for membership ${memberMembership.id} on ${activationDate.toISO()}${tenantId ? ` (tenant: ${tenantId})` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule activation for member membership ${memberMembership.id}:`,
        error,
      );
    }
  }

  /**
   * Handle activate member membership action
   */
  private async handleActivateMemberMembership(
    data: {
      memberMembershipId: string;
      currentUser: User;
      timezone: string;
      isNew: boolean;
      paymentPreference: EPaymentPreference;
      tenantId?: string;
    },
  ): Promise<void> {
    const { memberMembershipId, currentUser, timezone, isNew, paymentPreference, tenantId } = data;

    try {
      this.logger.log(`Activating member membership: ${memberMembershipId}`);

      const defaultPaymentMethod =  await this.paymentAdapterCardsService.getDefaultPaymentMethod(
              currentUser,
            );
      

      if (!defaultPaymentMethod) {
        this.logger.warn(
          `No default payment method found for user ${currentUser.id}, skipping activation`,
        );
      }

      this.memberMembershipBillingService.createMemberMembershipPaymentIntent({
        memberMembershipId: memberMembershipId,
        paymentMethodId: defaultPaymentMethod?.id,
        paymentPreference: paymentPreference,
      }, currentUser, timezone, Boolean(isNew));

      this.logger.log(`Successfully activated member membership: ${memberMembershipId}`);
    } catch (error) {
      this.logger.error(
        `Failed to activate member membership ${memberMembershipId}:`,
        error,
      );
      throw error;
    }
  }




  /**
   * Schedule recurring membership billing based on frequency
   * @param tenantId - Tenant ID for multi-tenant database routing (passed from event payload)
   */
  private async scheduleMembershipBilling(
    memberMembership: MemberMembership,
    tenantId?: string,
  ): Promise<void> {
    try {
      const membership = memberMembership.membership;
      if (!membership || !membership.billingFrequency) {
        return;
      }

      const memberMembershipBilling = await this.memberMembershipBillingService.getSingle({
        memberMembership: { id: memberMembership.id },
      }, {
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      // Calculate billing start date
      const timezone = memberMembershipBilling?.timezone || 'UTC'; // Default timezone, should be passed from context
      const now = DateTime.now().setZone(timezone);

      let billingStartDate: Date;
      if (membership.billingStartDay) {
        // Calculate next billing start day
        let billingStart = now.set({
          day: membership.billingStartDay,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        });

        if (billingStart <= now) {
          billingStart = billingStart.plus({ months: 1 });
        }
        billingStartDate = billingStart.toJSDate();
      } else {
        // No billing start day, start from next billing period
        billingStartDate = this.calculateNextBillingDate(
          now.toJSDate(),
          membership.billingFrequency,
        );
      }

      // Calculate end date based on membership expiry
      let endDate: Date | undefined;
      if (membership.expiry) {
        const startDate = DateTime.fromJSDate(billingStartDate).setZone(timezone);
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
        }

        if (duration?.months) {
          endDate = startDate.plus(duration).toJSDate();
        }
      }

      // Map billing frequency to schedule frequency
      const scheduleFrequency = this.mapBillingFrequencyToScheduleFrequency(
        membership.billingFrequency,
      );

      // Get billing start day for monthly schedules
      const monthDays = membership.billingStartDay
        ? [membership.billingStartDay]
        : undefined;

      // For WEEKLY frequency, we need to provide weekDays
      // Use the day of week from the billing start date
      let weekDays: number[] | undefined;
      if (scheduleFrequency === EScheduleFrequency.WEEKLY) {
        const startDate = DateTime.fromJSDate(billingStartDate).setZone(timezone);
        const dayOfWeek = startDate.weekday; // Luxon: 1 = Monday, 7 = Sunday
        // Convert to EDayOfWeek format: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Luxon 7 (Sunday) -> EDayOfWeek 0 (Sunday)
        // Luxon 1-6 (Mon-Sat) -> EDayOfWeek 1-6 (Mon-Sat)
        const scheduleDayOfWeek = dayOfWeek === 7 ? 0 : dayOfWeek;
        weekDays = [scheduleDayOfWeek];
        this.logger.log(
          `Calculated weekDays for WEEKLY billing: ${weekDays} (from billing start date: ${billingStartDate.toISOString()}, dayOfWeek: ${dayOfWeek})`,
        );
      }

      // Create recurring schedule
      await this.scheduleService.createSchedule({
        title: `Membership Billing - ${membership.title}`,
        description: `Recurring billing for membership ${membership.title}`,
        action: 'process-membership-billing',
        entityId: memberMembership.id,
        frequency: scheduleFrequency,
        weekDays,
        monthDays,
        startDate: billingStartDate.toISOString(),
        endDate: endDate?.toISOString(),
        timeOfDay: '00:00',
        timezone: timezone,
        retryOnFailure: true,
        tenantId, // Include tenant context for multi-tenant database routing
        data: {
          memberMembershipId: memberMembership.id,
          memberId: memberMembership.memberId,
          membershipId: membership.id,
          billingFrequency: membership.billingFrequency,
          lastBillingDate: billingStartDate.toISOString(), // Track last billing for quarterly/bi-annually
          tenantId, // Also store in data for action handlers
        },
      });

      this.logger.log(
        `Scheduled recurring billing for membership ${membership.title} starting from ${billingStartDate.toISOString()}${tenantId ? ` (tenant: ${tenantId})` : ''}`,
      );

      // Schedule annual fee if annualFeeDate exists
      if (membership.annualFee && membership.annualFeeDate) {
        await this.scheduleAnnualFee(memberMembership, membership, timezone, tenantId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to schedule billing for member membership ${memberMembership.id}:`,
        error,
      );
    }
  }

  /**
   * Schedule annual fee billing
   * @param tenantId - Tenant ID for multi-tenant database routing (passed from event payload)
   */
  private async scheduleAnnualFee(
    memberMembership: MemberMembership,
    membership: any,
    timezone: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      const annualFee = Number(membership.annualFee) || 0;
      if (annualFee <= 0 || !membership.annualFeeDate) {
        return;
      }

      // Parse annual fee date (format: DD-MM, e.g., "14-2" for February 14th)
      const [dayStr, monthStr] = membership.annualFeeDate.split('-');
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);

      if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) {
        this.logger.error(
          `Invalid annual fee date format: ${membership.annualFeeDate}. Expected DD-MM format.`,
        );
        return;
      }

      const now = DateTime.now().setZone(timezone);

      // Calculate annual fee date for current year
      let annualFeeDate = now.set({
        month,
        day,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      // If the date has passed this year, schedule for next year
      if (annualFeeDate <= now) {
        annualFeeDate = annualFeeDate.plus({ years: 1 });
      }

      // Calculate end date based on membership expiry
      let endDate: Date | undefined;
      if (membership.expiry) {
        const startDate = DateTime.fromJSDate(annualFeeDate.toJSDate()).setZone(timezone);
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
        }

        if (duration?.months) {
          endDate = startDate.plus(duration).toJSDate();
        }
      }

      // Create yearly schedule for annual fee
      // For yearly schedules, we use monthDays and months to specify the exact date
      await this.scheduleService.createSchedule({
        title: `Annual Fee - ${membership.title}`,
        description: `Annual fee billing for membership ${membership.title}`,
        action: 'process-annual-fee-billing',
        entityId: memberMembership.id,
        frequency: EScheduleFrequency.YEARLY,
        monthDays: [day],
        months: [month], // Schedule for specific month (1-12)
        startDate: annualFeeDate.toJSDate().toISOString(),
        endDate: endDate?.toISOString(),
        timeOfDay: '00:00',
        timezone: timezone,
        retryOnFailure: true,
        tenantId, // Include tenant context for multi-tenant database routing
        data: {
          memberMembershipId: memberMembership.id,
          memberId: memberMembership.memberId,
          membershipId: membership.id,
          tenantId, // Also store in data for action handlers
        },
      });

      this.logger.log(
        `Scheduled annual fee billing for membership ${membership.title} on ${annualFeeDate.toFormat('dd-MM-yyyy')} (${annualFeeDate.toISO()})${tenantId ? ` (tenant: ${tenantId})` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule annual fee for member membership ${memberMembership.id}:`,
        error,
      );
    }
  }

  /**
   * Calculate next billing date based on frequency
   */
  private calculateNextBillingDate(
    startDate: Date,
    frequency: EBillingFrequency,
  ): Date {
    const start = DateTime.fromJSDate(startDate);
    let nextDate: DateTime;

    switch (frequency) {
      case EBillingFrequency.DAILY:
        nextDate = start.plus({ days: 1 });
        break;
      case EBillingFrequency.WEEKLY:
        nextDate = start.plus({ weeks: 1 });
        break;
      case EBillingFrequency.MONTHLY:
        nextDate = start.plus({ months: 1 });
        break;
      case EBillingFrequency.QUARTERLY:
        nextDate = start.plus({ months: 3 });
        break;
      case EBillingFrequency.BI_ANNUALLY:
        nextDate = start.plus({ months: 6 });
        break;
      case EBillingFrequency.ANNUALLY:
        nextDate = start.plus({ years: 1 });
        break;
      default:
        nextDate = start.plus({ months: 1 });
    }

    return nextDate.toJSDate();
  }

  /**
   * Map billing frequency to schedule frequency
   * For quarterly and bi-annually, we use monthly and track in data
   */
  private mapBillingFrequencyToScheduleFrequency(
    billingFrequency: EBillingFrequency,
  ): EScheduleFrequency {
    switch (billingFrequency) {
      case EBillingFrequency.DAILY:
        return EScheduleFrequency.DAILY;
      case EBillingFrequency.WEEKLY:
        return EScheduleFrequency.WEEKLY;
      case EBillingFrequency.MONTHLY:
        return EScheduleFrequency.MONTHLY;
      case EBillingFrequency.QUARTERLY:
        return EScheduleFrequency.MONTHLY; // Check every month, bill every 3
      case EBillingFrequency.BI_ANNUALLY:
        return EScheduleFrequency.MONTHLY; // Check every month, bill every 6
      case EBillingFrequency.ANNUALLY:
        return EScheduleFrequency.YEARLY;
      default:
        return EScheduleFrequency.MONTHLY;
    }
  }

  /**
   * Handle process membership billing action
   */
  private async handleProcessMembershipBilling(
    data: {
      memberMembershipId: string;
      memberId: string;
      membershipId: string;
      billingFrequency?: EBillingFrequency;
      lastBillingDate?: string;
      tenantId?: string;
    },
  ): Promise<void> {
    const { memberMembershipId, memberId, membershipId, billingFrequency, lastBillingDate, tenantId } = data;

    try {
      // Get member membership with relations
      const memberMembership = await this.memberMembershipService.getSingle(
        memberMembershipId,
        {
          _relations: ['member', 'member.user', 'membership'],
        },
      );

      if (!memberMembership) {
        throw new NotFoundException('Member membership not found');
      }

      // Check if membership is still active
      if (!memberMembership.isActive) {
        this.logger.log(
          `Member membership ${memberMembershipId} is not active, skipping billing`,
        );
        return;
      }

      const member = memberMembership.member;
      if (!member || !member.user) {
        throw new NotFoundException('Member or user not found');
      }

      const membership = memberMembership.membership;
      if (!membership || !membership.enabled) {
        this.logger.log(
          `Membership ${membershipId} is not enabled, skipping billing`,
        );
        return;
      }

      const memberMembershipBilling = await this.memberMembershipBillingService.getSingle({
        memberMembership: { id: memberMembership.id },
      }, {
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });


      const timezone = memberMembershipBilling?.timezone || 'UTC';
      const now = DateTime.now().setZone(timezone);

      // Calculate amount (no prorate for recurring billing, full amount)
      const price = Number(membership.price) || 0;
      const issueDate = now.toJSDate();
      const dueDate = now.plus({ days: 7 }).toJSDate();

      const lineItems: Array<{ description: string; quantity: number; unitPrice: number }> = [];
      if (price > 0) {
        lineItems.push({
          description: `${membership.title} - Membership Fee (Recurring)`,
          quantity: 1,
          unitPrice: price,
        });
      }

      const { billing: newBilling } = await this.billingsService.createBilling({
        title: `Membership Payment - ${membership.title} (Recurring)`,
        description: `Recurring payment for ${membership.title} membership`,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        recipientUser: { id: member.user.id },
        type: EBillingType.MEMBERSHIP,
        lineItems,
      });

      // Link billing to member membership
      const memberMembershipBillingRepo = this.entityRouterService.getRepository<MemberMembershipBilling>(MemberMembershipBilling);
      await memberMembershipBillingRepo.save({
        billing: { id: newBilling.id },
        memberMembership: { id: memberMembershipId },
      });

      // Get default payment method via payment adapter (context already has tenantId)
      if (!tenantId) {
        this.logger.warn(
          `No tenantId in schedule data for member membership ${memberMembershipId}, skipping billing`,
        );
        return;
      }

      const defaultPaymentMethod = await this.paymentAdapterCardsService.getDefaultPaymentMethod(
        member.user,
      );

      if (!defaultPaymentMethod?.id) {
        this.logger.warn(
          `No default payment method found for member ${memberId}, skipping billing`,
        );
        return;
      }

      await this.billingsService.createBillingPaymentIntent(
        {
          billingId: newBilling.id,
          paymentMethodId: defaultPaymentMethod.id,
          saveForFutureUse: false,
          setAsDefault: false,
        },
        member.user,
        timezone,
        {
          memberMembershipId,
          memberId,
        },
        tenantId,
      );

      this.logger.log(
        `Successfully processed recurring billing for member membership ${memberMembershipId}`,
      );

      // Note: For quarterly/bi-annually, we track last billing in the most recent billing record
      // The schedule will check the last billing date from memberMembershipBilling records
    } catch (error) {
      this.logger.error(
        `Failed to process membership billing for ${memberMembershipId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Handle process annual fee billing action
   */
  private async handleProcessAnnualFeeBilling(
    data: {
      memberMembershipId: string;
      memberId: string;
      membershipId: string;
      tenantId?: string;
    },
  ): Promise<void> {
    const { memberMembershipId, memberId, membershipId } = data;

    try {
      // Get member membership with relations
      const memberMembership = await this.memberMembershipService.getSingle(
        memberMembershipId,
        {
          _relations: ['member', 'member.user', 'membership'],
        },
      );

      if (!memberMembership) {
        throw new NotFoundException('Member membership not found');
      }

      // Check if membership is still active
      if (!memberMembership.isActive) {
        this.logger.log(
          `Member membership ${memberMembershipId} is not active, skipping annual fee billing`,
        );
        return;
      }

      const member = memberMembership.member;
      if (!member || !member.user) {
        throw new NotFoundException('Member or user not found');
      }

      const membership = memberMembership.membership;
      if (!membership || !membership.enabled) {
        this.logger.log(
          `Membership ${membershipId} is not enabled, skipping annual fee billing`,
        );
        return;
      }

      const annualFee = Number(membership.annualFee) || 0;
      if (annualFee <= 0) {
        this.logger.log(
          `Membership ${membershipId} has no annual fee, skipping`,
        );
        return;
      }

      const memberMembershipBilling = await this.memberMembershipBillingService.getSingle({
        memberMembership: { id: memberMembership.id },
      }, {
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      const timezone = memberMembershipBilling?.timezone || 'UTC';
      const now = DateTime.now().setZone(timezone);
      const issueDate = now.toJSDate();
      const dueDate = now.plus({ days: 7 }).toJSDate();

      const lineItems: Array<{ description: string; quantity: number; unitPrice: number }> = [
        {
          description: `${membership.title} - Annual Fee`,
          quantity: 1,
          unitPrice: annualFee,
        },
      ];

      const { billing: newBilling } = await this.billingsService.createBilling({
        title: `Annual Fee - ${membership.title}`,
        description: `Annual fee payment for ${membership.title} membership`,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        recipientUser: { id: member.user.id },
        type: EBillingType.MEMBERSHIP,
        lineItems,
      });

      // Link billing to member membership
      const memberMembershipBillingRepo = this.entityRouterService.getRepository<MemberMembershipBilling>(MemberMembershipBilling);
      await memberMembershipBillingRepo.save({
        billing: { id: newBilling.id },
        memberMembership: { id: memberMembershipId },
      });


      // Get default payment method via payment adapter (context already has tenantId)
      const feeTenantId = (data as { tenantId?: string }).tenantId;
      if (!feeTenantId) {
        this.logger.warn(
          `No tenantId in schedule data for annual fee ${memberMembershipId}, skipping`,
        );
        return;
      }

      const defaultPaymentMethod = await this.paymentAdapterCardsService.getDefaultPaymentMethod(
        member.user,
      );

      if (!defaultPaymentMethod?.id) {
        this.logger.warn(
          `No default payment method found for member ${memberId}, skipping annual fee billing`,
        );
        return;
      }

      await this.billingsService.createBillingPaymentIntent(
        {
          billingId: newBilling.id,
          paymentMethodId: defaultPaymentMethod.id,
          saveForFutureUse: false,
          setAsDefault: false,
        },
        member.user,
        timezone,
        {
          memberMembershipId,
          memberId,
        },
        feeTenantId,
      );

      this.logger.log(
        `Successfully processed annual fee billing for member membership ${memberMembershipId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process annual fee billing for ${memberMembershipId}:`,
        error,
      );
      throw error;
    }
  }
}

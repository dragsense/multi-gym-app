import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { MemberMembershipBilling } from '../entities/member-membership-billing.entity';

import { User } from '@/common/base-user/entities/user.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { IMessageResponse } from '@shared/interfaces';
import { StripeBillingService } from '@/modules/v1/stripe/services/stripe-billing.service';
import { StripeCustomerService } from '@/modules/v1/stripe/services/stripe-customer.service';
import { BillingsService } from '../../billings/billings.service';
import { CrudService } from '@/common/crud/crud.service';
import { Repository, Not } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { EBillingStatus, EBillingType } from '@shared/enums/billing.enum';
import { DateTime } from 'luxon';
import { Billing } from '../../billings/entities/billing.entity';
import { BillingHistoryService } from '../../billings/services/billing-history.service';
import { MemberMembership } from '../entities/member-membership.entity';
import { CreateMemberMembershipPaymentIntentDto, MemberMembershipPaymentIntentDto } from '@shared/dtos';
import { EPaymentPreference } from '@shared/enums/membership.enum';
import { EBillingFrequency } from '@shared/enums/membership.enum';
import { forwardRef, Inject } from '@nestjs/common';
import { MemberMembershipService } from './member-membership.service';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { MembersService } from '@/modules/v1/members/members.service';

@Injectable()
export class MemberMembershipBillingService extends CrudService<MemberMembershipBilling> {
  private readonly customLogger = new LoggerService(MemberMembershipBillingService.name);

  constructor(
    @InjectRepository(MemberMembershipBilling)
    private readonly memberMembershipBillingRepo: Repository<MemberMembershipBilling>,
    protected readonly entityRouterService: EntityRouterService,
    @Inject(forwardRef(() => MemberMembershipService))
    private readonly memberMembershipService: MemberMembershipService,
    private readonly billingsService: BillingsService,
    private readonly membersService: MembersService,
    moduleRef: ModuleRef,
  ) {
    super(memberMembershipBillingRepo, moduleRef);
  }


  async createMemberMembershipWithPaymentIntent(
    createMemberMembershipPaymentIntentDto: CreateMemberMembershipPaymentIntentDto,
    currentUser: User,
    timezone: string,
  ): Promise<IMessageResponse> {
    const {
      membershipId,
      paymentMethodId,
      paymentPreference,
    } = createMemberMembershipPaymentIntentDto;

    const member = await this.membersService.getSingle({ userId: currentUser.id });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const { memberMembership, isNew } = await this.memberMembershipService.createMemberMembership(
      membershipId,
      member.id,
      timezone,
    );



    const { billing } = await this.createMemberMembershipPaymentIntent(
      {
        memberMembershipId: memberMembership.id,
        paymentPreference,
        paymentMethodId,
        saveForFutureUse: true,
        setAsDefault: true,
      },
      currentUser,
      timezone,
      isNew === true
    );

    // Check if payment was successful
    const { status } = await this.billingsService.getBillingStatus(billing.id);
    if (status === EBillingStatus.PAID || paymentPreference === EPaymentPreference.CASH) {
      // Activate member membership
      await this.memberMembershipService.activateMemberMembership(
        memberMembership.id,
        'MEMBERSHIP_PAYMENT_INTENT',
        {
          billingId: billing.id,
          memberId: memberMembership.memberId,
        },
      ).catch((error: Error) => {
        this.customLogger.error(
          `Failed to activate member membership: ${error.message}`,
          error.stack,
        );
      });
    }

    return { message: 'Member membership and payment intent created successfully' };
  }

  async createMemberMembershipPaymentIntent(
    memberMembershipPaymentIntentDto: MemberMembershipPaymentIntentDto,
    currentUser: User,
    timezone: string,
    includeSignupFee: boolean = true,
  ): Promise<IMessageResponse & { billing: Billing }> {
    const {
      memberMembershipId,
      paymentMethodId,
      setAsDefault,
      saveForFutureUse,
      paymentPreference,
    } = memberMembershipPaymentIntentDto;

    // Fetch member membership with relations
    const memberMembership = await this.memberMembershipService.getSingle(memberMembershipId,
      { _relations: ['member', 'member.user', 'membership'] })


    if (!memberMembership) {
      throw new NotFoundException('Member membership not found');
    }

    if (!memberMembership.member.user) {
      throw new BadRequestException('Member user not found');
    }

    const memberUser = memberMembership.member.user;

    if (memberUser.id !== currentUser.id) {
      throw new ForbiddenException(
        'You are not authorized to create a payment intent for this member',
      );
    }

    // Get membership details
    const membership = memberMembership.membership;
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (!membership.enabled) {
      throw new BadRequestException('Membership is not enabled');
    }


    // Calculate billing start date
    const now = DateTime.now().setZone(timezone);
    let billingStartDate: Date;
    let shouldProrate = false;
    let prorateAmount = 0;

    if (membership.prorate && membership.billingStartDay) {
      // Prorate enabled AND billing start day exists: calculate prorate from today to billing start day
      billingStartDate = this.calculateBillingStartDate(membership.billingStartDay, timezone);
      shouldProrate = true;
    } else if (membership.prorate && !membership.billingStartDay) {
      // Prorate enabled BUT no billing start day: don't prorate, start billing today
      billingStartDate = now.toJSDate();
      shouldProrate = false;
    } else if (!membership.prorate && membership.billingStartDay) {
      // Prorate disabled AND billing start day exists: billing starts from that date
      billingStartDate = this.calculateBillingStartDate(membership.billingStartDay, timezone);
      shouldProrate = false;
    } else {
      // Prorate disabled AND no billing start day: billing starts from today
      billingStartDate = now.toJSDate();
      shouldProrate = false;
    }

    // Calculate amounts
    const fullPrice = Number(membership.calculatedPrice) || 0;
    const signupFee = includeSignupFee ? Number(membership.signupFee) || 0 : 0;

    let membershipFee = fullPrice;
    if (shouldProrate && membership.billingFrequency) {
      // Calculate prorate from today to billing start date
      prorateAmount = this.calculateProrateAmount(
        fullPrice,
        membership.billingFrequency,
        now.toJSDate(),
        billingStartDate,
        timezone,
      );
      membershipFee = prorateAmount;
    }

    // Calculate total amount (annual fee will be added to line items if no annualFeeDate)
    const annualFee = Number(membership.annualFee) || 0;
    const totalAmount = membershipFee + signupFee + (annualFee > 0 && !membership.annualFeeDate ? annualFee : 0);
    const amountCents = Math.round(totalAmount * 100);

    if (!amountCents || amountCents <= 0) {
      throw new BadRequestException('Invalid membership amount');
    }


    const issueDate = now.toJSDate();
    const dueDate = DateTime.fromJSDate(issueDate).setZone(timezone).plus({ days: 7 }).toJSDate();

    const lineItems: Array<{ description: string; quantity: number; unitPrice: number }> = [];
    if (membershipFee > 0) {
      const description = shouldProrate
        ? `${membership.title} - Membership Fee (Prorated)`
        : `${membership.title} - Membership Fee`;
      lineItems.push({
        description,
        quantity: 1,
        unitPrice: membershipFee,
      });
    }
    if (signupFee > 0) {
      lineItems.push({
        description: `${membership.title} - Signup Fee`,
        quantity: 1,
        unitPrice: signupFee,
      });
    }

    // Add annual fee to initial billing if there's no annual fee date
    if (annualFee > 0 && !membership.annualFeeDate) {
      lineItems.push({
        description: `${membership.title} - Annual Fee`,
        quantity: 1,
        unitPrice: annualFee,
      });
    }

    const { billing: newBilling } = await this.billingsService.createBilling({
      title: `Membership Payment - ${membership.title}`,
      description: membership.description || `Payment for ${membership.title} membership`,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      recipientUser: { id: memberUser.id },
      type: EBillingType.MEMBERSHIP,
      isCashable: paymentPreference === EPaymentPreference.CASH,
      lineItems,
    });


    let savedMemberMembershipBilling: MemberMembershipBilling | null = null;
    let billing = newBilling;

    try {
      savedMemberMembershipBilling = await this.create({
        billing: { id: newBilling.id },
        memberMembership: { id: memberMembershipId },
      });



      // Only create payment intent for ONLINE payments
      if (paymentPreference === EPaymentPreference.ONLINE && paymentMethodId) {
        await this.billingsService.createBillingPaymentIntent({
          billingId: billing.id,
          paymentMethodId,
          saveForFutureUse,
          setAsDefault,
        }, currentUser, timezone, {
          memberMembershipId,
          memberId: memberMembership.memberId,
        });
      }
    } catch (error) {
      if (savedMemberMembershipBilling)
        await this.permanentlyDelete(savedMemberMembershipBilling.id);

      if (billing) {
        await this.billingsService.permanentlyDelete(billing.id);
      }
      throw error;
    }
    // For CASH payments, billing is created but payment intent is not created
    // The billing will remain in PENDING status until manually marked as paid

    return { message: paymentPreference === EPaymentPreference.CASH ? 'Billing created successfully. Payment pending.' : 'Payment intent created successfully', billing };
  }

  async getMemberMembershipBillings(memberId: string): Promise<MemberMembershipBilling[]> {
    const repository = this.getRepository();
    return repository.find({
      where: {
        memberMembership: { memberId: memberId },
      },
      relations: [
        'memberMembership',
        'memberMembership.membership',
        'memberMembership.member',
        'billing',
        'createdBy',
      ],
    });
  }

  /**
   * Calculate prorate amount based on billing frequency and days remaining
   */
  private calculateProrateAmount(
    fullAmount: number,
    billingFrequency: EBillingFrequency,
    startDate: Date,
    endDate: Date,
    timezone: string,
  ): number {
    const start = DateTime.fromJSDate(startDate).setZone(timezone);
    const end = DateTime.fromJSDate(endDate).setZone(timezone);
    const totalDays = end.diff(start, 'days').days;

    if (totalDays <= 0) {
      return 0;
    }

    let billingPeriodDays: number;
    switch (billingFrequency) {
      case EBillingFrequency.DAILY:
        billingPeriodDays = 1;
        break;
      case EBillingFrequency.WEEKLY:
        billingPeriodDays = 7;
        break;
      case EBillingFrequency.MONTHLY:
        billingPeriodDays = 30; // Approximate
        break;
      case EBillingFrequency.QUARTERLY:
        billingPeriodDays = 90; // Approximate
        break;
      case EBillingFrequency.BI_ANNUALLY:
        billingPeriodDays = 180; // Approximate
        break;
      case EBillingFrequency.ANNUALLY:
        billingPeriodDays = 365;
        break;
      default:
        billingPeriodDays = 30;
    }

    const prorateRatio = totalDays / billingPeriodDays;
    return Math.round((fullAmount * prorateRatio) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate billing start date based on billing start day
   */
  private calculateBillingStartDate(
    billingStartDay: number | undefined,
    timezone: string,
  ): Date {
    const now = DateTime.now().setZone(timezone);

    if (!billingStartDay) {
      return now.toJSDate();
    }

    // Get the next occurrence of the billing start day
    let billingStart = now.set({ day: billingStartDay, hour: 0, minute: 0, second: 0, millisecond: 0 });

    // If the day has already passed this month, move to next month
    if (billingStart <= now) {
      billingStart = billingStart.plus({ months: 1 });
    }

    return billingStart.toJSDate();
  }



}


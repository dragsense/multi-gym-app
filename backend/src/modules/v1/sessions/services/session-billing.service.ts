import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { SessionBilling } from '../entities/session-billing.entity';

import { User } from '@/common/base-user/entities/user.entity';
import { SessionsService } from '../sessions.service';
import { LoggerService } from '@/common/logger/logger.service';
import { IMessageResponse } from '@shared/interfaces';
import { StripeBillingService } from '@/modules/v1/stripe/services/stripe-billing.service';
import { StripeCustomerService } from '@/modules/v1/stripe/services/stripe-customer.service';
import { SessionPaymentIntentDto } from '@shared/dtos';
import { BillingsService } from '../../billings/billings.service';
import { CrudService } from '@/common/crud/crud.service';
import { EntityManager, Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { EBillingStatus, EBillingType } from '@shared/enums/billing.enum';
import { DateTime } from 'luxon';
import { SessionDto } from '@shared/dtos/session-dtos/session.dto';
import { Session } from '../entities/session.entity';
import { Billing } from '../../billings/entities/billing.entity';
import { BillingHistoryService } from '../../billings/services/billing-history.service';
import { BillingHistory } from '../../billings/entities/billing-history.entity';
import { generateInvoiceRef } from '../../billings/utils/billing.utils';

@Injectable()
export class SessionBillingService extends CrudService<SessionBilling> {
  private readonly customLogger = new LoggerService(SessionBillingService.name);

  constructor(
    @InjectRepository(SessionBilling)
    private readonly sessionBillingRepo: Repository<SessionBilling>,
    private readonly sessionsService: SessionsService,
    private readonly billingsService: BillingsService,
    private readonly stripeBillingService: StripeBillingService,
    private readonly stripeCustomerService: StripeCustomerService,
    private readonly billingHistoryService: BillingHistoryService,
    moduleRef: ModuleRef,
  ) {
    super(sessionBillingRepo, moduleRef);
  }

  async getMemberSessionBillings(memberId: string): Promise<SessionBilling[]> {
    const repository = this.getRepository();
    return repository.find({
      where: {
        member: { id: memberId },
      },
      relations: [
        'session',
        'member',
        'billing',
        'session.trainer',
        'createdBy',
      ],
    });
  }

  async checkMemberSessionPayment(
    sessionId: string,
    memberId: string,
  ): Promise<{
    hasPaid: boolean;
    paidAt?: Date | null;
  }> {
    const sessionIdPaylaod = sessionId.split('@');
    const orignalSessionId = sessionIdPaylaod[0];


    const repository = this.getRepository();
    const sessionBilling = await repository.findOne({
      where: {
        session: { id: orignalSessionId },
        member: { id: memberId },
      },
      relations: ['billing'],
    });

    if (!sessionBilling || !sessionBilling.billing) {
      return { hasPaid: false };
    }

    return this.billingsService.checkBillingPayment(sessionBilling.billing.id);
  }

  async createSessionPaymentIntent(
    sessionPaymentIntentDto: SessionPaymentIntentDto,
    currentUser: User,
    timezone: string,
  ): Promise<IMessageResponse> {
    const {
      sessionId,
      memberId: memberId,
      paymentMethodId,
      setAsDefault,
      saveForFutureUse,
    } = sessionPaymentIntentDto;

    const sessionIdPaylaod = sessionId.split('@');
    const orignalSessionId = sessionIdPaylaod[0];
    const date = sessionIdPaylaod[1];

    // Check if the session is already paid
    const { hasPaid } = await this.checkMemberSessionPayment(
      orignalSessionId,
      memberId,
    );
    if (hasPaid) {
      return { message: 'Session is already paid for this member' };
    }

    // Fetch session with members
    let session: Session | SessionDto | null =
      await this.sessionsService.getSingle(orignalSessionId, {
        _relations: ['members', 'members.user'],
      });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (date) {
      session = await this.sessionsService.getCalendarEvent(session, date);
    }

    // Verify member is part of the session
    const member = session.members?.find((c) => c.id === memberId);
    if (!member) {
      throw new BadRequestException(
        'Member is not associated with this session',
      );
    }
    if (!member.user) {
      throw new BadRequestException('Member user not found');
    }

    const memberUser = member.user;

  /*   if (memberUser.id !== currentUser.id) {
      throw new ForbiddenException(
        'You are not authorized to create a payment intent for this member',
      );
    } */

    // Amount in cents (assuming session.price is in dollars)
    const amount = Number(session.price) || 0;
    const amountCents = Math.round(amount * 100);
    if (!amountCents || amountCents <= 0) {
      throw new BadRequestException('Invalid session amount');
    }


    let billing: Billing | null = null;

//-------------------------------------------------------------
    //This block of code actullay causing error 
    //Unable to process billing 
//    const sessionBilling = await this.getSingle(
//      {
//        session: { id: orignalSessionId },
//        member: { id: memberId },
//      },
//      {
//        relations: ['billing'],
//      },
//    );
//--------------------------------------------------------------------------


    //Updated version of code
    const repository = this.getRepository();
    const sessionBilling = await repository.findOne({
    where: {
      session: { id: orignalSessionId },
      member: { id: memberId },
    },
    relations: ['billing'],
  });

    if (sessionBilling && sessionBilling.billing)
      billing = sessionBilling.billing;
    else {

      const { message, billing: newBilling } = await this.billingsService.createBilling({
        title: `Session Payment - ${session.title}`,
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        recipientUser: { id: memberUser.id },
        type: EBillingType.SESSION,
        lineItems: [{
          description: `Session Payment - ${session.title}`,
          quantity: 1,
          unitPrice: amount,
        }],
      });

      if (date) {
        session = await this.sessionsService.createRuccrenceSingleSession(
          session as Session,
          date,
        );
      }

      if (sessionBilling) {
        await repository.save({
          billing: { id: newBilling.id },
          session: { id: session.id },
          member: { id: memberId },
        })
      }
      billing = newBilling;
    }

    await this.billingsService.createBillingPaymentIntent({
      billingId: billing.id,
      paymentMethodId,
      saveForFutureUse,
      setAsDefault,
    }, currentUser, timezone, {
      sessionId,
      memberId: memberId,
    });

    return { message: 'Payment intent created successfully' };
  }
}

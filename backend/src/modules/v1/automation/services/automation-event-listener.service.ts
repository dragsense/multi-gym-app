import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayload } from '@/common/helper/services/event.service';
import { AutomationService } from '../automation.service';
import { AutomationExecutionService, AutomationContext } from './automation-execution.service';
import { EAutomationTrigger } from '@shared/enums';
import { RequestContext } from '@/common/context/request-context';
import { Member } from '../../members/entities/member.entity';
import { Billing } from '../../billings/entities/billing.entity';
import { Checkin } from '../../checkins/entities/checkin.entity';
import { MemberMembership } from '../../memberships/entities/member-membership.entity';
import { CheckinsService } from '../../checkins/checkins.service';
import { BillingsService } from '../../billings/billings.service';
import { MembersService } from '../../members/members.service';
import { MemberMembershipService } from '../../memberships/services/member-membership.service';

@Injectable()
export class AutomationEventListenerService implements OnModuleInit {
  private readonly logger = new Logger(AutomationEventListenerService.name);

  constructor(
    private readonly automationService: AutomationService,
    private readonly automationExecutionService: AutomationExecutionService,
    private readonly checkinsService: CheckinsService,
    private readonly billingsService: BillingsService,
    private readonly membersService: MembersService,
    private readonly memberMembershipService: MemberMembershipService,
  ) {}

  onModuleInit() {
    this.logger.log('✅ AutomationEventListenerService initialized');
  }

  /**
   * Handle member creation event (ONBOARD trigger)
   */
  @OnEvent('member.crud.create')
  async handleMemberCreated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    await this.executeAutomationsForTrigger(
      EAutomationTrigger.ONBOARD,
      payload,
      async (entity) => {
        // Reload member with relations to ensure user is loaded
        const member = await this.membersService.getSingle(payload.entityId, {
          _relations: ['user'],
        });
        
        if (!member) {
          this.logger.warn(`Member ${payload.entityId} not found`);
          return {};
        }

        return {
          member: {
            id: member.id,
            user: member.user
              ? {
                  id: member.user.id,
                  email: member.user.email,
                  firstName: member.user.firstName,
                  lastName: member.user.lastName,
                }
              : undefined,
          },
        };
      },
    );
  }

  /**
   * Handle billing creation event (BILLING trigger)
   */
  @OnEvent('billing.crud.create')
  async handleBillingCreated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    await this.executeAutomationsForTrigger(
      EAutomationTrigger.BILLING,
      payload,
      async (entity) => {
        // Reload billing with relations to ensure recipientUser is loaded
        const billing = await this.billingsService.getSingle(payload.entityId, {
          _relations: ['recipientUser'],
        });
        
        if (!billing) {
          this.logger.warn(`Billing ${payload.entityId} not found`);
          return {};
        }

        return {
          billing: {
            id: billing.id,
            amount: billing.amount,
            issueDate: billing.issueDate,
            dueDate: billing.dueDate,
          },
          user: billing.recipientUser
            ? {
                id: billing.recipientUser.id,
                email: billing.recipientUser.email,
                firstName: billing.recipientUser.firstName,
                lastName: billing.recipientUser.lastName,
              }
            : undefined,
        };
      },
    );
  }

  /**
   * Handle billing paid event (BILLING trigger)
   */
  @OnEvent('billing.status.paid')
  async handleBillingPaid(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    await this.executeAutomationsForTrigger(
      EAutomationTrigger.BILLING,
      payload,
      async (entity) => {
        // Reload billing with relations to ensure recipientUser is loaded
        const billing = await this.billingsService.getSingle(payload.entityId, {
          _relations: ['recipientUser'],
        });
        
        if (!billing) {
          this.logger.warn(`Billing ${payload.entityId} not found`);
          return {};
        }

        return {
          billing: {
            id: billing.id,
            amount: billing.amount,
            issueDate: billing.issueDate,
            dueDate: billing.dueDate,
          },
          user: billing.recipientUser
            ? {
                id: billing.recipientUser.id,
                email: billing.recipientUser.email,
                firstName: billing.recipientUser.firstName,
                lastName: billing.recipientUser.lastName,
              }
            : undefined,
        };
      },
    );
  }

  /**
   * Handle checkin creation event (CHECKIN trigger)
   */
  @OnEvent('checkin.crud.create')
  async handleCheckinCreated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    await this.executeAutomationsForTrigger(
      EAutomationTrigger.CHECKIN,
      payload,
      async (entity) => {
        // Reload checkin with relations to ensure user and location are loaded
        const checkin = await this.checkinsService.getSingle(payload.entityId, {
          _relations: ['user', 'location'],
        });
        
        if (!checkin) {
          this.logger.warn(`Checkin ${payload.entityId} not found`);
          return {};
        }

        return {
          checkin: {
            id: checkin.id,
            checkInTime: checkin.checkInTime,
            checkOutTime: checkin.checkOutTime,
            location: checkin.location
              ? {
                  id: checkin.location.id,
                  name: (checkin.location as any).name,
                }
              : undefined,
          },
          user: checkin.user
            ? {
                id: checkin.user.id,
                email: checkin.user.email,
                firstName: checkin.user.firstName,
                lastName: checkin.user.lastName,
              }
            : undefined,
        };
      },
    );
  }

  /**
   * Handle checkin update event (CHECKOUT trigger)
   * Only trigger if checkout time was set
   */
  @OnEvent('checkin.crud.update')
  async handleCheckinUpdated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    const oldEntity = payload.oldEntity as Checkin | undefined;
    const newEntity = payload.entity as Checkin;

    // Only trigger if checkout time was just set (was null, now has value)
    if (oldEntity && !oldEntity.checkOutTime && newEntity.checkOutTime) {
      await this.executeAutomationsForTrigger(
        EAutomationTrigger.CHECKOUT,
        payload,
        async (entity) => {
          // Reload checkin with relations to ensure user and location are loaded
          const checkin = await this.checkinsService.getSingle(payload.entityId, {
            _relations: ['user', 'location'],
          });
          
          if (!checkin) {
            this.logger.warn(`Checkin ${payload.entityId} not found`);
            return {};
          }

          return {
            checkin: {
              id: checkin.id,
              checkInTime: checkin.checkInTime,
              checkOutTime: checkin.checkOutTime,
              location: checkin.location
                ? {
                    id: checkin.location.id,
                    name: (checkin.location as any).name,
                  }
                : undefined,
            },
            user: checkin.user
              ? {
                  id: checkin.user.id,
                  email: checkin.user.email,
                  firstName: checkin.user.firstName,
                  lastName: checkin.user.lastName,
                }
              : undefined,
          };
        },
      );
    }
  }

  /**
   * Handle membership activation/renewal event (MEMBERSHIP_RENEWAL trigger)
   */
  @OnEvent('membermembership.activated')
  async handleMembershipActivated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    await this.executeAutomationsForTrigger(
      EAutomationTrigger.MEMBERSHIP_RENEWAL,
      payload,
      async (entity) => {
        // Reload memberMembership with relations to ensure member, member.user, and membership are loaded
        const memberMembership = await this.memberMembershipService.getSingle(payload.entityId, {
          _relations: ['member', 'member.user', 'membership'],
        });
        
        if (!memberMembership) {
          this.logger.warn(`MemberMembership ${payload.entityId} not found`);
          return {};
        }

        return {
          membership: {
            id: memberMembership.id,
            name: memberMembership.membership
              ? (memberMembership.membership as any).name
              : undefined,
            startDate: memberMembership.startDate || undefined,
          },
          member: memberMembership.member
            ? {
                id: memberMembership.member.id,
                user: memberMembership.member.user
                  ? {
                      id: memberMembership.member.user.id,
                      email: memberMembership.member.user.email,
                      firstName: memberMembership.member.user.firstName,
                      lastName: memberMembership.member.user.lastName,
                    }
                  : undefined,
              }
            : undefined,
        };
      },
    );
  }

  /**
   * Generic method to execute automations for a trigger
   */
  private async executeAutomationsForTrigger(
    trigger: EAutomationTrigger,
    payload: EventPayload,
    contextBuilder: (entity: any) => Promise<AutomationContext>,
  ): Promise<void> {
    if (!payload.entity) {
      return;
    }

    // Get tenantId from event payload data
    const data = payload.data as { tenantId?: string } | undefined;
    const tenantId = data?.tenantId;

    // Execute within RequestContext to maintain tenant context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        // Get all active automations for this trigger
        const automations = await this.automationService.getActiveAutomationsByTrigger(
          trigger,
        );

        if (automations.length === 0) {
          this.logger.debug(
            `No active automations found for trigger: ${trigger} (tenant: ${tenantId || 'none'})`,
          );
          return;
        }

        this.logger.log(
          `Found ${automations.length} active automation(s) for trigger: ${trigger} (tenant: ${tenantId || 'none'})`,
        );

        // Build context from entity
        const context = await contextBuilder(payload.entity);

        // Execute each automation
        for (const automation of automations) {
          try {
            await this.automationExecutionService.executeAutomation(
              automation,
              context,
            );
          } catch (error) {
            this.logger.error(
              `Failed to execute automation ${automation.id} for trigger ${trigger}:`,
              error instanceof Error ? error.message : String(error),
            );
            // Continue with other automations even if one fails
          }
        }
      } catch (error) {
        this.logger.error(
          `Error processing automations for trigger ${trigger}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { In } from 'typeorm';
import { NotificationService } from '@/common/notification/notification.service';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import {
    ENotificationPriority,
    ENotificationType,
} from '@shared/enums/notification.enum';
import { MemberMembership } from '../entities/member-membership.entity';

@Injectable()
export class MembershipNotificationService {
    private readonly logger = new Logger(MembershipNotificationService.name);

    constructor(
        private readonly notificationService: NotificationService,
        private readonly entityRouterService: EntityRouterService,
    ) { }

    /**
     * Notify admins when a membership is activated
     */
    async notifyAdminsMembershipActivated(
        memberMembership: MemberMembership,
        createdBy?: string,
    ): Promise<void> {
        try {
            const userRepo = this.entityRouterService.getRepository<User>(User);
            const adminUsers = await userRepo.find({
                where: {
                    level: In([
                        EUserLevels.PLATFORM_OWNER,
                        EUserLevels.SUPER_ADMIN,
                        EUserLevels.ADMIN,
                    ]),
                    isActive: true,
                },
                select: ['id', 'email', 'firstName', 'lastName'],
            });

            if (adminUsers.length === 0) {
                return;
            }

            const notificationPromises = adminUsers.map((admin) =>
                this.notificationService.createNotification({
                    title: 'Membership Activated',
                    message: `Membership "${memberMembership.membership?.title}" has been activated for ${memberMembership.member?.user?.firstName} ${memberMembership.member?.user?.lastName}.`,
                    type: ENotificationType.SUCCESS,
                    priority: ENotificationPriority.NORMAL,
                    entityId: admin.id,
                    entityType: 'membership',
                    metadata: {
                        action: 'membership_activated',
                        memberMembershipId: memberMembership.id,
                        membershipId: memberMembership.membershipId,
                        memberId: memberMembership.memberId,
                        createdBy,
                    },
                }),
            );

            await Promise.all(notificationPromises);
            this.logger.log(`✅ Membership activation notifications sent to ${adminUsers.length} admins`);
        } catch (error) {
            this.logger.error('❌ Failed to send membership activation notifications to admins', error);
        }
    }

    /**
     * Notify admins when a membership is cancelled
     */
    async notifyAdminsMembershipCancelled(
        memberMembership: MemberMembership,
        cancelledBy?: string,
    ): Promise<void> {
        try {
            const userRepo = this.entityRouterService.getRepository<User>(User);
            const adminUsers = await userRepo.find({
                where: {
                    level: In([
                        EUserLevels.PLATFORM_OWNER,
                        EUserLevels.SUPER_ADMIN,
                        EUserLevels.ADMIN,
                    ]),
                    isActive: true,
                },
            });

            const notificationPromises = adminUsers.map((admin) =>
                this.notificationService.createNotification({
                    title: 'Membership Cancelled',
                    message: `Membership "${memberMembership.membership?.title}" for ${memberMembership.member?.user?.firstName} ${memberMembership.member?.user?.lastName} was cancelled.`,
                    type: ENotificationType.WARNING,
                    priority: ENotificationPriority.HIGH,
                    entityId: admin.id,
                    entityType: 'membership',
                    metadata: {
                        action: 'membership_cancelled',
                        memberMembershipId: memberMembership.id,
                        cancelledBy,
                    },
                }),
            );

            await Promise.all(notificationPromises);
        } catch (error) {
            this.logger.error('❌ Failed to send membership cancellation notifications', error);
        }
    }

    /**
     * Notify member when their membership is activated
     */
    async notifyMemberMembershipActivated(
        memberMembership: MemberMembership,
    ): Promise<void> {
        try {
            if (!memberMembership.member?.user?.id) return;

            await this.notificationService.createNotification({
                title: 'Membership Activated!',
                message: `Your membership "${memberMembership.membership?.title}" is now active. Welcome!`,
                type: ENotificationType.SUCCESS,
                priority: ENotificationPriority.NORMAL,
                entityId: memberMembership.member.user.id,
                entityType: 'membership',
                metadata: {
                    action: 'membership_activated',
                    memberMembershipId: memberMembership.id,
                },
            });
        } catch (error) {
            this.logger.error('❌ Failed to notify member about activation', error);
        }
    }
}

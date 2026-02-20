import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '@/common/notification/notification.service';
import { EmailTemplateService } from '@/common/email/email-template.service';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { ENotificationType } from '@shared/enums/notification.enum';
import { Order } from '../entities/order.entity';
import { In } from 'typeorm';

@Injectable()
export class OrdersNotificationListener {
    private readonly logger = new Logger(OrdersNotificationListener.name);

    constructor(
        private readonly notificationService: NotificationService,
        private readonly entityRouterService: EntityRouterService,
        private readonly emailTemplateService: EmailTemplateService,
    ) { }

    @OnEvent('order.success')
    async handleOrderSuccessEvent(payload: {
        entity: Order;
        data: { tenantId?: string };
    }) {
        const { entity: order, data } = payload;
        const tenantId = data?.tenantId;

        this.logger.log(
            `Handling order success event for order ${order.id} (Tenant: ${tenantId})`,
        );

        try {
            // Get Repositories
            const orderRepo = this.entityRouterService.getRepository<Order>(Order, tenantId);
            const userRepo = this.entityRouterService.getRepository<User>(User, tenantId);

            // Fetch full order with line items and buyer details
            const orderEntity = await orderRepo.findOne({
                where: { id: order.id },
                relations: ['lineItems', 'buyerUser'],
            });

            if (!orderEntity) {
                this.logger.error(`Order ${order.id} not found during notification processing`);
                return;
            }

            // Generate Content
            const orderRef = orderEntity.orderRef || orderEntity.id.substring(0, 8).toUpperCase();
            const { html: summaryHtml, text: summaryText } = this.generateOrderContent(orderEntity);

            // 1. Notify the Buyer (Staff/Member)
            if (orderEntity.buyerUser && orderEntity.buyerUser.id) {
                const buyerMessage = `Your order #${orderRef} is received.\n\n${summaryText}`;

                await this.notificationService.createNotification({
                    title: 'Order Received',
                    message: buyerMessage,
                    type: ENotificationType.INFO,
                    entityId: orderEntity.buyerUser.id,
                    entityType: 'order',
                    emailSubject: `Order Received #${orderRef}`,
                    htmlContent: this.emailTemplateService.generateHTML({
                        title: 'Order Received',
                        greeting: `Dear ${orderEntity.buyerUser.firstName || 'User'}`,
                        content: `
                            <p>Your order <strong>#${orderRef}</strong> has been received successfully.</p>
                            ${summaryHtml}
                        `,
                    }),
                    metadata: {
                        orderId: orderEntity.id,
                        action: 'order_created',
                    },
                });
            }

            // 2. Notify Admins
            const admins = await userRepo.find({
                where: {
                    level: In([EUserLevels.ADMIN, EUserLevels.PLATFORM_OWNER]),
                },
                select: ['id'],
            });

            if (admins.length > 0) {
                const buyerName = orderEntity.buyerUser
                    ? `${order.buyerUser.firstName} ${order.buyerUser.lastName}`.trim()
                    : 'Unknown User';

                const adminMessage = `New order placed by ${buyerName} (Ref: #${orderRef}).\n\n${summaryText}`;

                // Send to all admins
                await Promise.all(
                    admins.map((admin) =>
                        this.notificationService.createNotification({
                            title: 'New Order Placed',
                            message: adminMessage,
                            type: ENotificationType.INFO,
                            entityId: admin.id,
                            entityType: 'order',
                            emailSubject: `New Order Placed - #${orderRef} by ${buyerName}`,
                            htmlContent: this.emailTemplateService.generateHTML({
                                title: 'New Order Placed',
                                greeting: `Dear Admin`,
                                content: `
                                    <p><strong>${buyerName}</strong> has placed a new order <strong>#${orderRef}</strong>.</p>
                                    ${summaryHtml}
                                `,
                            }),
                            metadata: {
                                orderId: orderEntity.id,
                                action: 'admin_order_created',
                            },
                        }),
                    ),
                );
            }
        } catch (error) {
            this.logger.error(
                `Error handling order success notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error.stack,
            );
        }
    }

    private generateOrderContent(order: Order): { html: string; text: string } {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(order.totalAmount);

        const createdDate = new Date(order.createdAt).toLocaleDateString();
        const orderRef = order.orderRef || order.id.substring(0, 8).toUpperCase();

        // HTML Logic
        const lineItemsHtml = order.lineItems && order.lineItems.length > 0
            ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0 0 8px 0;"><strong>Line Items:</strong></p>
                    ${order.lineItems.map((item) => {
                const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                return `<p style="margin: 4px 0; font-size: 13px;">${item.description || 'N/A'} - Qty: ${item.quantity || 0} × ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice || 0)} = ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemTotal)}</p>`;
            }).join('')}
                </div>
            `
            : '';

        const html = `
            <div class="info-box">
                <p style="margin: 0 0 8px 0;"><strong>Order:</strong> #${orderRef}</p>
                <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${createdDate}</p>
                <p style="margin: 0 0 8px 0;"><strong>Status:</strong> ${order.status}</p>
                <p style="margin: 0 0 8px 0;"><strong>Total:</strong> ${formattedAmount}</p>
                ${order.description ? `<p style="margin: 0 0 8px 0;"><strong>Description:</strong> ${order.description}</p>` : ''}
                ${lineItemsHtml}
            </div>
        `;

        // Text Logic
        const lineItemsText = order.lineItems && order.lineItems.length > 0
            ? `\nLine Items:\n${order.lineItems.map((item) => {
                const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                return `  - ${item.description || 'N/A'} - Qty: ${item.quantity || 0} × ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice || 0)} = ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemTotal)}`;
            }).join('\n')}`
            : '';

        const text = `
Order: #${orderRef}
Date: ${createdDate}
Status: ${order.status}
Total: ${formattedAmount}
${order.description ? `Description: ${order.description}` : ''}
${lineItemsText}
        `;

        return { html, text };
    }
}



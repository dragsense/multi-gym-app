import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { Order } from './entities/order.entity';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderListDto,
  CreateOrderLineItemDto,
  SingleQueryDto,
} from '@shared/dtos';
import { EOrderStatus } from '@shared/enums/order.enum';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { generateOrderRef } from './utils/order.utils';
import { IMessageResponse, IPaginatedResponse } from '@shared/interfaces';
import { OrderHistoryService } from './order-history.service';

@Injectable()
export class OrdersService extends CrudService<Order> {
  constructor(
    @InjectRepository(Order)
    orderRepo: Repository<Order>,
    moduleRef: ModuleRef,
    @Inject(forwardRef(() => OrderHistoryService))
    private readonly orderHistoryService: OrderHistoryService,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['buyerUser.password'],
      searchableFields: ['title', 'description', 'orderRef'],
    };
    super(orderRepo, moduleRef, crudOptions);
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
    currentUser: User,
    billingId?: string,
  ): Promise<IMessageResponse & { order: Order }> {
    const buyerId = createOrderDto.buyerUser?.id ?? currentUser.id;
    if (buyerId !== currentUser.id) {
      const isAdmin =
        currentUser.level === (EUserLevels.PLATFORM_OWNER as number) ||
        currentUser.level === (EUserLevels.ADMIN as number);
      if (!isAdmin) {
        throw new ForbiddenException('You can only create orders for yourself');
      }
    }

    const lineItems = createOrderDto.lineItems;
    if (!lineItems?.length) {
      throw new BadRequestException('At least one line item is required');
    }

    const totalAmount = lineItems.reduce(
      (sum: number, item: CreateOrderLineItemDto) =>
        sum + (item.quantity || 0) * Number(item.unitPrice || 0),
      0,
    );

    const order = await this.create<
      CreateOrderDto & {
        totalAmount: number;
        orderRef: string;
        status: EOrderStatus;
        billing?: { id: string };
      }
    >(
      {
        ...createOrderDto,
        totalAmount: Number(totalAmount.toFixed(2)),
        orderRef: generateOrderRef(),
        status: EOrderStatus.CREATED,
        ...(billingId && { billing: { id: billingId } }),
      },
      {
        beforeCreate: (processedData: CreateOrderDto & { totalAmount: number; orderRef: string; billing?: { id: string } }) => {
          return {
            ...processedData,
            buyerUser: { id: buyerId },
            billing: processedData.billing,
            lineItems: processedData.lineItems.map((item) => ({
              productId: item.productId,
              productVariantId: item.productVariantId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          };
        },
        afterCreate: (savedOrder) => {
          this.orderHistoryService.create({
            order: { id: savedOrder.id },
            status: EOrderStatus.CREATED,
            source: 'ORDER_CREATED',
            message: 'Order created successfully',
            occurredAt: new Date(),
            ...(currentUser && { changedBy: { id: currentUser.id } }),
          }).catch((error) => {
            this.logger.error(`Failed to create order history entry: ${error.message}`, error.stack);
          });
        },
      },
    );


    return { message: 'Order created successfully.', order };
  }

  /**
   * Update order status and create history entry
   */
  async updateOrderStatus(
    orderId: string,
    status: EOrderStatus,
    currentUser: User,
  ): Promise<IMessageResponse> {
    const order = await this.getSingle(orderId, SingleQueryDto);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;

    await this.update(
      orderId,
      { status },
      {
        afterUpdate: async (updatedOrder) => {
          // Create history entry for status change
          await this.orderHistoryService.create({
            order: { id: orderId },
            status,
            source: 'STATUS_UPDATE',
            message: `Status changed from ${previousStatus} to ${status}`,
            metadata: { previousStatus, newStatus: status },
            occurredAt: new Date(),
            ...(currentUser && { changedBy: { id: currentUser.id } }),
          });
        },
      },
    );

    return { message: 'Order status updated successfully.' };
  }

  async getOrder(id: string, query: SingleQueryDto<Order>, currentUser: User): Promise<Order | null> {

    const isAdmin =
      currentUser.level === (EUserLevels.PLATFORM_OWNER as number) ||
      currentUser.level === (EUserLevels.ADMIN as number);

    const order = await this.getSingle(id, query, SingleQueryDto, {
      beforeQuery: (qb: SelectQueryBuilder<Order>) => {
        if (!isAdmin) {
          qb.andWhere('entity.buyerUserId = :uid', { uid: currentUser.id });
        }
        return qb;
      },
    });

    if (!order) return null;

    return order;
  }

  async listOrders(
    query: OrderListDto,
    currentUser: User,
  ): Promise<IPaginatedResponse<Order>> {
    const isAdmin =
      currentUser.level === (EUserLevels.PLATFORM_OWNER as number) ||
      currentUser.level === (EUserLevels.ADMIN as number);
    return this.get(query, OrderListDto, {
      beforeQuery: (qb: SelectQueryBuilder<Order>) => {
        if (!isAdmin) {
          qb.leftJoin('entity.buyerUser', '_buyerUser').andWhere(
            new Brackets((b) => {
              b.where('_buyerUser.id = :uid', { uid: currentUser.id });
            }),
          );
        }
      },
    });
  }
}

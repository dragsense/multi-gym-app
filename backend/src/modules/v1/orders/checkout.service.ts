import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { OrdersService } from './orders.service';
import { BillingsService } from '@/modules/v1/billings/billings.service';
import { User } from '@/common/base-user/entities/user.entity';
import { CheckoutDto, CreateOrderDto, CreateOrderLineItemDto } from '@shared/dtos';
import { Order } from './entities/order.entity';
import { IMessageResponse } from '@shared/interfaces';
import { EBillingType } from '@shared/enums/billing.enum';
import { EPaymentPreference } from '@shared/enums/membership.enum';
import { LoggerService } from '@/common/logger/logger.service';
import { Product } from '../product/entities/product.entity';
import { ProductVariant } from '../product/entities/product-variant.entity';
import { OrderHistoryService } from './order-history.service';
import { EOrderStatus } from '@shared/enums/order.enum';
import { OrderHistory } from './entities/order-history.entity';
import { RequestContext } from '@/common/context/request-context';

@Injectable()
export class CheckoutService {

  private readonly logger = new LoggerService(CheckoutService.name);

  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
    private readonly billingsService: BillingsService,
    private readonly orderHistoryService: OrderHistoryService,
  ) { }


  private async deductInventoryFromCartItems(items: Array<{
    productId: string;
    productVariantId?: string | null;
    quantity: number;
  }>, manager: EntityManager) {
    // Use a short transaction with row-level locks to prevent overselling
    const productRepo = manager.getRepository(Product);
    const variantRepo = manager.getRepository(ProductVariant);

    for (const item of items) {
      const qty = Number(item.quantity ?? 0);
      if (!qty || qty <= 0) continue;

      // Lock & decrement variant quantity (if variant specified)
      if (item.productVariantId) {
        const variant = await variantRepo
          .createQueryBuilder('v')
          .setLock('pessimistic_write')
          .where('v.id = :id', { id: item.productVariantId })
          .getOne();

        if (!variant) {
          throw new BadRequestException('Product variant not found');
        }
        if (variant.isActive === false) {
          throw new BadRequestException('Product variant is not active');
        }
        if ((variant.quantity ?? 0) < qty) {
          throw new BadRequestException('Insufficient variant quantity');
        }

        variant.quantity = Number(variant.quantity ?? 0) - qty;
        await manager.save(variant);
      }

      // Lock & decrement product total quantity
      const product = await productRepo
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.id = :id', { id: item.productId })
        .getOne();

      if (!product) {
        throw new BadRequestException('Product not found');
      }
      if (product.isActive === false) {
        throw new BadRequestException('Product is not active');
      }
      if ((product.totalQuantity ?? 0) < qty) {
        throw new BadRequestException('Insufficient product quantity');
      }

      product.totalQuantity = Number(product.totalQuantity ?? 0) - qty;
      await manager.save(product);

    }
  }

  async checkout(
    currentUser: User,
    dto: CheckoutDto,
    timezone: string,
  ): Promise<IMessageResponse> {
    const cart = await this.cartService.getCart(currentUser.id);
    const items = cart.items ?? [];
    if (items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (dto.paymentPreference === EPaymentPreference.ONLINE && !dto.paymentMethodId) {
      throw new BadRequestException('Payment method is required for online payment');
    }

    const lineItems: CreateOrderLineItemDto[] = items.map((item) => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const title =
      dto.title ??
      `Order - ${items.map((i) => i.description).slice(0, 2).join(', ')}${items.length > 2 ? '...' : ''}`;

    const createOrderDto: CreateOrderDto = {
      title,
      description: 'Store checkout',
      buyerUser: { id: currentUser.id },
      lineItems,
      paymentMethodId: dto.paymentMethodId,
      shippingAddressLine1: dto.shippingAddressLine1,
      shippingAddressLine2: dto.shippingAddressLine2,
      shippingCity: dto.shippingCity,
      shippingState: dto.shippingState,
      shippingZip: dto.shippingZip,
      shippingCountry: dto.shippingCountry,
    };

    // 1) Create ORDER first. If this fails, nothing is persisted – cart unchanged, no data loss.
    const { order } = await this.ordersService.createOrder(
      createOrderDto,
      currentUser,
      undefined, // no billing yet
    );

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 7);

    const isCashable = dto.paymentPreference === EPaymentPreference.CASH;

    const tenantId = RequestContext.get<string>('tenantId');

    this.billingsService.createBilling({
      title,
      description: 'Store checkout',
      issueDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      recipientUser: { id: currentUser.id },
      type: EBillingType.PRODUCT,
      isCashable,
      lineItems: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    }).then(({ billing }) => {
      this.ordersService.update(order.id, { status: EOrderStatus.PENDING, billing: { id: billing.id } }, {
        afterUpdate: async (savedEntity, manager) => {
          try {


            const orderHistoryRepo = manager.getRepository(OrderHistory);
            const orderHistory = await orderHistoryRepo.create({
              order: { id: order.id },
              status: EOrderStatus.PENDING,
              source: 'ORDER_PENDING',
              message: 'Order pending',
              metadata: { billingId: billing.id },
              occurredAt: new Date(),
              ...(currentUser && { changedBy: { id: currentUser.id } }),
            });
            await orderHistoryRepo.save(orderHistory);

            await this.deductInventoryFromCartItems(
              items.map((i) => ({
                productId: i.productId,
                productVariantId: i.productVariantId && typeof i.productVariantId === 'string' && i.productVariantId.trim() !== ''
                  ? i.productVariantId
                  : undefined,
                quantity: i.quantity,
                description: i.description,
              })),
              manager,
            );

            // 5) For ONLINE: process payment ONLY after inventory validation succeeds
            if (dto.paymentPreference === EPaymentPreference.ONLINE && dto.paymentMethodId) {
              await this.billingsService.createBillingPaymentIntent(
                {
                  billingId: billing.id,
                  paymentMethodId: dto.paymentMethodId,
                  saveForFutureUse: dto.saveForFutureUse ?? false,
                  setAsDefault: dto.setAsDefault ?? false,
                },
                currentUser,
                timezone,
                { orderId: order.id },
                tenantId,
              );
              this.logger.log(`Payment intent created successfully for order ${order.id}`);
            }

            this.cartService.clearCart(currentUser.id).catch((error) => {
              this.logger.error(`Failed to clear cart: ${error.message}`, error.stack);
            });


            this.ordersService.emitEvent('order.success', order);

          } catch (error) {
            this.logger.error(`Failed to emit order success event: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to process order');
          }
          return order;
        },
      }).catch((error) => {
        this.logger.error(`Failed to update order: ${error.message}`, error.stack);
        this.billingsService.permanentlyDelete(billing.id).catch((error) => {
          this.logger.error(`Failed to permanently delete billing: ${error.message}`, error.stack);
        });
        this.ordersService.delete(order.id).catch((error) => {
          this.logger.error(`Failed to delete order: ${error.message}`, error.stack);
        });
      });
    }).catch((error) => {
      this.logger.error(`Failed to create billing: ${error.message}`, error.stack);
      this.ordersService.permanentlyDelete(order.id).catch((error) => {
        this.logger.error(`Failed to permanently delete order: ${error.message}`, error.stack);
      });
    });

    return { message: 'Order is being processed. You will receive an email with the order details.' } as IMessageResponse;

  }
}

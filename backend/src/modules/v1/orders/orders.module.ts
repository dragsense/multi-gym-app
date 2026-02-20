import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudModule } from '@/common/crud/crud.module';
import { NotificationModule } from '@/common/notification/notification.module';
import { Order } from './entities/order.entity';
import { OrderLineItem } from './entities/order-line-item.entity';
import { OrderHistory } from './entities/order-history.entity';
import { OrdersService } from './orders.service';
import { OrderHistoryService } from './order-history.service';
import { OrdersController } from './orders.controller';
import { CheckoutService } from './checkout.service';
import { CartModule } from '../cart/cart.module';
import { BillingsModule } from '../billings/billings.module';
import { User } from '@/common/base-user/entities/user.entity';
import { Product } from '../product/entities/product.entity';
import { ProductVariant } from '../product/entities/product-variant.entity';
import { OrdersNotificationListener } from './listeners/orders-notification.listener';
import { EmailTemplateService } from '@/common/email/email-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderLineItem, OrderHistory, User, Product, ProductVariant]),
    CrudModule,
    CartModule,
    BillingsModule,
    NotificationModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderHistoryService, CheckoutService, OrdersNotificationListener, EmailTemplateService],
  exports: [OrdersService, OrderHistoryService, CheckoutService],
})
export class OrdersModule { }

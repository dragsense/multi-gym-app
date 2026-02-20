import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { OrderHistory } from './entities/order-history.entity';
import { CreateOrderHistoryDto, OrderHistoryListDto } from '@shared/dtos';
import { EOrderStatus } from '@shared/enums/order.enum';
import { User } from '@/common/base-user/entities/user.entity';

@Injectable()
export class OrderHistoryService extends CrudService<OrderHistory> {
  constructor(
    @InjectRepository(OrderHistory)
    orderHistoryRepo: Repository<OrderHistory>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['source', 'message'],
    };
    super(orderHistoryRepo, moduleRef, crudOptions);
  }


  /**
   * Get order history timeline
   */
  async getOrderTimeline(orderId: string): Promise<OrderHistory[]> {
    return this.getAll(
      {
        _relations: ['changedBy'],
      },
      undefined,
      {
        beforeQuery: async (query) => {
          query.andWhere('entity.orderId = :orderId', { orderId })
            .orderBy('entity.createdAt', 'ASC');
          return query;
        },
      },
    );
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { IMessageResponse } from '@shared/interfaces';

@Injectable()
export class SubscriptionsService extends CrudService<Subscription> {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: [],
      searchableFields: ['title', 'description'],
    };
    super(subscriptionRepo, moduleRef, crudOptions);
  }

  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<IMessageResponse> {
    // Use CRUD service create method
    const subscription = await this.create(createSubscriptionDto, {
      beforeCreate: async (
        processedData: CreateSubscriptionDto,
        manager: EntityManager,
      ) => {
        const existingSubscription = await manager.findOne(Subscription, {
          where: {
            title: processedData.title,
          },
        });

        if (existingSubscription) {
          throw new ConflictException('Subscription title already exists');
        }

        return {
          ...processedData,
        };
      },
    });

    return { message: 'Subscription created successfully' };
  }

  async updateSubscription(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<IMessageResponse> {
    // Get existing subscription
    const existingSubscription = await this.getSingle({ id });
    if (!existingSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Update subscription
    await this.update(id, updateSubscriptionDto, {
      beforeUpdate: async (
        processedData: UpdateSubscriptionDto,
        existingEntity: Subscription,
        manager: EntityManager,
      ) => {
        // Check if title is being changed and if it already exists
        if (
          processedData.title &&
          processedData.title !== existingEntity.title
        ) {
          const titleExists = await manager.findOne(Subscription, {
            where: { title: processedData.title },
          });

          if (titleExists) {
            throw new ConflictException('Subscription title already exists');
          }
        }

        // MUST ALWAYS RETURN the update DTO
        return processedData;
      },
    });

    return { message: 'Subscription updated successfully' };
  }
}

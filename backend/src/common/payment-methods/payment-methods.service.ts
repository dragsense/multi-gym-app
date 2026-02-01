import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { PaymentMethod } from './entities/payment-method.entity';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from '@shared/dtos/payment-methods-dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { EPaymentMethodType } from '@shared/enums';

@Injectable()
export class PaymentMethodsService extends CrudService<PaymentMethod> {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: [],
      searchableFields: ['type', 'description'],
    };
    super(paymentMethodRepository, moduleRef, crudOptions);
  }

  async createPaymentMethod(createPaymentMethodDto: CreatePaymentMethodDto) {
    // Check if payment method type already exists
    const repository = this.getRepository();
    const existingPaymentMethod = await repository.findOne({
      where: { type: createPaymentMethodDto.type },
    });

    if (existingPaymentMethod) {
      throw new ConflictException('Payment method type already exists');
    }

    return this.create(createPaymentMethodDto);
  }

  async updatePaymentMethod(
    id: string,
    updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    const repository = this.getRepository();
    const paymentMethod = await repository.findOne({
      where: { id },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // If changing type, check if new type already exists
    if (
      updatePaymentMethodDto.type &&
      updatePaymentMethodDto.type !== paymentMethod.type
    ) {
      const existingPaymentMethod = await repository.findOne({
        where: { type: updatePaymentMethodDto.type },
      });

      if (existingPaymentMethod) {
        throw new ConflictException('Payment method type already exists');
      }
    }

    return this.update(id, updatePaymentMethodDto);
  }

  /**
   * Check if a payment method is enabled by key/type
   */
  async isPaymentMethodEnabled(
    paymentMethodKey: EPaymentMethodType,
  ): Promise<boolean> {
    const paymentMethod = await this.getSingle({
      type: paymentMethodKey,
    });

    return paymentMethod?.enabled || false;
  }
}

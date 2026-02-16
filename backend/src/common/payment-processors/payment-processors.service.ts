import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { PaymentProcessor } from './entities/payment-processor.entity';
import {
  CreatePaymentProcessorDto,
  UpdatePaymentProcessorDto,
} from '@shared/dtos/payment-processors-dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { EPaymentProcessorType } from '@shared/enums';

@Injectable()
export class PaymentProcessorsService extends CrudService<PaymentProcessor> {
  constructor(
    @InjectRepository(PaymentProcessor)
    private readonly paymentProcessorRepository: Repository<PaymentProcessor>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: [],
      searchableFields: ['type', 'description'],
    };
    super(paymentProcessorRepository, moduleRef, crudOptions);
  }

  getRepository(): Repository<PaymentProcessor> {
    return this.paymentProcessorRepository;
  }

  async createPaymentProcessor(createPaymentProcessorDto: CreatePaymentProcessorDto) {
    const repository = this.getRepository();
    const existing = await repository.findOne({
      where: { type: createPaymentProcessorDto.type },
    });

    if (existing) {
      throw new ConflictException('Payment processor type already exists');
    }

    return this.create(createPaymentProcessorDto);
  }

  async updatePaymentProcessor(
    id: string,
    updatePaymentProcessorDto: UpdatePaymentProcessorDto,
  ) {
    const repository = this.getRepository();
    const processor = await repository.findOne({
      where: { id },
    });

    if (!processor) {
      throw new NotFoundException('Payment processor not found');
    }

    if (
      updatePaymentProcessorDto.type &&
      updatePaymentProcessorDto.type !== processor.type
    ) {
      const existing = await repository.findOne({
        where: { type: updatePaymentProcessorDto.type },
      });

      if (existing) {
        throw new ConflictException('Payment processor type already exists');
      }
    }

    return this.update(id, updatePaymentProcessorDto);
  }

  async isPaymentProcessorEnabled(
    processorKey: EPaymentProcessorType,
  ): Promise<boolean> {
    const processor = await this.getSingle({
      type: processorKey,
    });

    return processor?.enabled ?? false;
  }
}

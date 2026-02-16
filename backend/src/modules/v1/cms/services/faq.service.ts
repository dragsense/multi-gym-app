import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Faq } from '../entities/faq.entity';
import {
  CreateFaqDto,
  UpdateFaqDto,
  FaqListDto,
} from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class FaqService extends CrudService<Faq> {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepo: Repository<Faq>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['question', 'answer'],
    };
    super(faqRepo, moduleRef, crudOptions);
  }

  async createFaq(createDto: CreateFaqDto): Promise<Faq> {
    return this.create<CreateFaqDto>(createDto);
  }

  async updateFaq(id: string, updateDto: UpdateFaqDto): Promise<Faq> {
    return this.update(id, updateDto);
  }
}

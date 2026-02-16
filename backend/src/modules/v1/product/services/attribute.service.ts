import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Attribute } from '../entities/attribute.entity';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class AttributeService extends CrudService<Attribute> {
  constructor(
    @InjectRepository(Attribute)
    attributeRepo: Repository<Attribute>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name'],
    };
    super(attributeRepo, moduleRef, crudOptions);
  }
}

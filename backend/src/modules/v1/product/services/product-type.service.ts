import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { ProductType } from '../entities/product-type.entity';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class ProductTypeService extends CrudService<ProductType> {
  constructor(
    @InjectRepository(ProductType)
    productTypeRepo: Repository<ProductType>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name'],
    };
    super(productTypeRepo, moduleRef, crudOptions);
  }
}

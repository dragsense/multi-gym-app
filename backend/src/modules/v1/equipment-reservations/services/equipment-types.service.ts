import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { EquipmentType } from '../entities/equipment-type.entity';
import { CreateEquipmentTypeDto, UpdateEquipmentTypeDto } from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { IMessageResponse } from '@shared/interfaces';

@Injectable()
export class EquipmentTypesService extends CrudService<EquipmentType> {
  constructor(
    @InjectRepository(EquipmentType)
    private readonly equipmentTypeRepo: Repository<EquipmentType>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: [],
      searchableFields: ['name', 'description'],
    };
    super(equipmentTypeRepo, moduleRef, crudOptions);
  }
}

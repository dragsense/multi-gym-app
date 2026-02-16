import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { AccessFeature } from './entities/access-feature.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class AccessFeaturesService extends CrudService<AccessFeature> {
  private readonly customLogger = new LoggerService(AccessFeaturesService.name);

  constructor(
    @InjectRepository(AccessFeature)
    private readonly accessFeatureRepo: Repository<AccessFeature>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name', 'description'],
    };
    super(accessFeatureRepo, moduleRef, crudOptions);
  }
}


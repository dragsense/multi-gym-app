import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Resource } from '../entities/resource.entity';
import { CrudService } from '@/common/crud/crud.service';

@Injectable()
export class ResourcesService extends CrudService<Resource> {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    moduleRef: ModuleRef,
  ) {
    super(resourceRepository, moduleRef, {
      searchableFields: ['name', 'displayName', 'entityName'],
    });
  }
}
